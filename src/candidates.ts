import { basename } from 'node:path'
import { CONTRACT_SPECS } from './contracts.js'
import { run } from './compile.js'
import type { ProveCandidate } from './prove.js'
import type { BytecodeEntry, CompileProfile, Manifest, ManifestEntry, SubmoduleOverride } from './types.js'

const COMMIT_RE = /^[0-9a-f]{40}$/

/** A candidate pin plus how its manifest entry is written when it proves. */
export interface Candidate {
  prove: ProveCandidate
  /** Profile written to the manifest; undefined writes the build's effective settings as context "native". */
  profile?: CompileProfile
  /** The candidate's source entry, when it comes from another chain in the manifest. */
  source?: BytecodeEntry
}

/** A commit offered by `--candidate` or `--candidates-from`, with the profiles to build it with. */
export interface ExplicitCommit {
  repo: string
  commit: string
  profiles: Array<CompileProfile | 'native'>
  /** Optimizer and EVM settings of a checkout that leaves solc unpinned; tried with each solc the manifest uses for the key. */
  unpinnedSolc?: Omit<CompileProfile, 'solc'>
  /** Also try every profile the manifest uses for the key. */
  manifestProfiles?: boolean
  origin: string
}

function isBytecodeEntry(entry: ManifestEntry | undefined): entry is BytecodeEntry {
  return entry !== undefined && entry.verified !== 'canonical' && typeof entry.commit === 'string' && !entry.waiver
}

function buildFields(profile: CompileProfile | 'native'): string {
  return profile === 'native' ? 'native' : `${profile.solc}|${profile.optimizer_runs}|${profile.evm_version}`
}

function buildIdentity(repo: string, commit: string, contractName: string, profile: CompileProfile | 'native', overrides?: SubmoduleOverride[]): string {
  return [repo, commit, contractName, buildFields(profile), JSON.stringify(overrides ?? [])].join('|')
}

/** The fields an entry for another chain copies: everything but the chain-specific evidence and proxy addresses. */
function portable(entry: BytecodeEntry): string {
  const { evidence, proxy, ...rest } = entry
  return JSON.stringify({ ...rest, overrides: evidence?.submoduleOverrides, proxyType: proxy?.type })
}

function keyRepos(manifest: Manifest, key: string): Set<string> {
  const repos = new Set<string>()
  const spec = CONTRACT_SPECS[key]
  if (spec) repos.add(spec.defaultRepo)
  for (const entries of Object.values(manifest)) {
    const e = entries[key]
    if (isBytecodeEntry(e)) repos.add(e.repo)
  }
  return repos
}

function keyContractNames(manifest: Manifest, key: string): string[] {
  const names = [...(CONTRACT_SPECS[key]?.contractNames ?? [])]
  for (const entries of Object.values(manifest)) {
    const e = entries[key]
    if (isBytecodeEntry(e) && !names.includes(e.contractName)) names.push(e.contractName)
  }
  return names
}

/** Distinct build profiles the manifest uses for `key`, most used first. */
export function keyProfiles(manifest: Manifest, key: string): CompileProfile[] {
  const seen = new Map<string, { profile: CompileProfile; uses: number }>()
  for (const entries of Object.values(manifest)) {
    const e = entries[key]
    if (!isBytecodeEntry(e)) continue
    const id = buildFields(e.profile)
    const prev = seen.get(id)
    seen.set(id, { profile: prev?.profile ?? e.profile, uses: (prev?.uses ?? 0) + 1 })
  }
  return [...seen.values()].sort((a, b) => b.uses - a.uses).map((s) => s.profile)
}

/**
 * Candidates for `key` on `chainId` from the pins other chains use for that
 * key, with their profiles, declared submodule pins and proxy declarations.
 * Order: pins this chain already uses for another key, then the most widely
 * used, then the lowest chain id. The written evidence origin names the chain
 * the pin was taken from.
 */
export function manifestCandidates(manifest: Manifest, chainId: number, key: string): Candidate[] {
  const chain = String(chainId)
  const onChain = new Set(
    Object.values(manifest[chain] ?? {})
      .filter(isBytecodeEntry)
      .map((e) => `${e.repo}|${e.commit}|${buildFields(e.profile)}`),
  )
  type Sourced = { entry: BytecodeEntry; chain: string }
  const groups = new Map<string, { entries: Sourced[]; first: number }>()
  Object.entries(manifest).forEach(([c, entries], index) => {
    const e = entries[key]
    if (c === chain || !isBytecodeEntry(e)) return
    const id = buildIdentity(e.repo, e.commit, e.contractName, e.profile, e.evidence?.submoduleOverrides)
    const group = groups.get(id) ?? { entries: [], first: index }
    groups.set(id, { ...group, entries: [...group.entries, { entry: e, chain: c }] })
  })

  const ranked = [...groups.values()].map(({ entries, first }) => {
    const variants = new Map<string, Sourced[]>()
    for (const s of entries) variants.set(portable(s.entry), [...(variants.get(portable(s.entry)) ?? []), s])
    const { entry: source, chain: sourceChain } = [...variants.values()].sort((a, b) => b.length - a.length)[0]![0]!
    const affinity = onChain.has(`${source.repo}|${source.commit}|${buildFields(source.profile)}`)
    return { source, sourceChain, uses: entries.length, first, affinity }
  })
  ranked.sort((a, b) => Number(b.affinity) - Number(a.affinity) || b.uses - a.uses || a.first - b.first)

  return ranked.map(({ source, sourceChain }) => ({
    source,
    profile: source.profile,
    prove: {
      repo: source.repo,
      commit: source.commit,
      contractName: source.contractName,
      profile: source.profile,
      recursiveSubmodules: CONTRACT_SPECS[key]?.recursiveSubmodules,
      ...(source.evidence?.submoduleOverrides ? { submoduleOverrides: source.evidence.submoduleOverrides } : {}),
      origin: `manifest:${sourceChain}`,
    },
  }))
}

function commitProfiles(manifest: Manifest, key: string, c: ExplicitCommit): Array<CompileProfile | 'native'> {
  const known = keyProfiles(manifest, key)
  const unpinned = c.unpinnedSolc
    ? [...new Set(known.map((p) => p.solc))].map((solc): CompileProfile => ({ ...c.unpinnedSolc!, solc }))
    : []
  const all = [...(CONTRACT_SPECS[key]?.deployProfiles ?? []), ...c.profiles, ...unpinned, ...(c.manifestProfiles ? known : [])]
  return all.filter((p, i) => all.findIndex((q) => buildFields(q) === buildFields(p)) === i)
}

/** Candidates for `key` from explicitly offered commits of the repos that can hold it. */
export function explicitCandidates(manifest: Manifest, key: string, commits: ExplicitCommit[]): Candidate[] {
  const repos = keyRepos(manifest, key)
  const names = keyContractNames(manifest, key)
  return commits
    .filter((c) => repos.has(c.repo))
    .flatMap((c) =>
      commitProfiles(manifest, key, c).flatMap((profile) =>
        names.map((contractName) => ({
          ...(profile === 'native' ? {} : { profile }),
          prove: {
            repo: c.repo,
            commit: c.commit,
            contractName,
            profile,
            recursiveSubmodules: CONTRACT_SPECS[key]?.recursiveSubmodules,
            origin: c.origin,
          },
        })),
      ),
    )
}

/** `--candidate owner/repo@sha` or `repo@sha` (owner defaults to euler-xyz). */
export function parseCandidateArg(arg: string): { repo: string; commit: string } {
  const at = arg.lastIndexOf('@')
  const repoPart = at > 0 ? arg.slice(0, at) : ''
  const commit = at > 0 ? arg.slice(at + 1).toLowerCase() : ''
  if (!repoPart || !COMMIT_RE.test(commit)) {
    throw new Error(`--candidate "${arg}": expected <repo>@<40-hex commit>, e.g. euler-xyz/evk-periphery@<sha>`)
  }
  return { repo: repoPart.includes('/') ? repoPart : `euler-xyz/${repoPart}`, commit }
}

/** GitHub owner/name from a remote URL, or null when it isn't on GitHub. */
export function githubSlug(url: string): string | null {
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url.trim())
  return m ? `${m[1]}/${m[2]}` : null
}

/** The checkout's foundry settings, as `forge config` resolves them; solc is null when the checkout doesn't pin it. */
async function checkoutSettings(dir: string, context: string): Promise<(Omit<CompileProfile, 'solc'> & { solc: string | null }) | null> {
  const config = JSON.parse(await run('forge', ['config', '--json'], { cwd: dir, env: { ...process.env, FOUNDRY_PROFILE: 'default' } })) as {
    solc?: string | null
    solc_version?: string | null
    optimizer_runs?: number
    evm_version?: string
  }
  const solc = config.solc ?? config.solc_version ?? null
  if (config.optimizer_runs === undefined || !config.evm_version) return null
  return { context, solc: solc && /^\d+\.\d+\.\d+$/.test(solc) ? solc : null, optimizer_runs: config.optimizer_runs, evm_version: config.evm_version }
}

/**
 * The commits a deploying checkout offers: its HEAD and the gitlinks of its
 * GitHub submodules, built with the checkout's foundry profile, then each
 * submodule's own profile, then the profiles the manifest uses for the key.
 */
export async function checkoutCommits(dir: string): Promise<ExplicitCommit[]> {
  const repo = githubSlug(await run('git', ['remote', 'get-url', 'origin'], { cwd: dir }))
  if (!repo) throw new Error(`--candidates-from ${dir}: origin is not a GitHub repository`)
  const head = (await run('git', ['rev-parse', 'HEAD'], { cwd: dir })).trim()
  const settings = await checkoutSettings(dir, basename(repo))
  const pinned: CompileProfile[] = settings?.solc ? [{ ...settings, solc: settings.solc }] : []
  const unpinnedSolc = settings && !settings.solc ? { context: settings.context, optimizer_runs: settings.optimizer_runs, evm_version: settings.evm_version } : undefined
  const origin = `candidates-from:${repo}@${head.slice(0, 8)}`
  const offer = (repoSlug: string, commit: string, own: Array<'native'>): ExplicitCommit => ({
    repo: repoSlug,
    commit,
    profiles: [...pinned, ...own],
    ...(unpinnedSolc ? { unpinnedSolc } : {}),
    manifestProfiles: true,
    origin,
  })

  const config = await run('git', ['config', '-f', '.gitmodules', '--get-regexp', '^submodule\\..*\\.(path|url)$'], { cwd: dir }).catch(() => '')
  const byName = new Map<string, { path?: string; url?: string }>()
  for (const line of config.split('\n').filter(Boolean)) {
    const m = /^submodule\.(.+)\.(path|url)\s+(.+)$/.exec(line)
    if (m) byName.set(m[1]!, { ...byName.get(m[1]!), [m[2]!]: m[3]!.trim() })
  }
  const urlByPath = new Map([...byName.values()].filter((v) => v.path && v.url).map((v): [string, string] => [v.path!, v.url!]))
  const gitlinks = (await run('git', ['ls-tree', '-r', 'HEAD'], { cwd: dir }))
    .split('\n')
    .map((line) => /^160000 commit ([0-9a-f]{40})\t(.+)$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)

  const submodules = gitlinks.flatMap(([, commit, path]) => {
    const slug = githubSlug(urlByPath.get(path!) ?? '')
    return slug ? [offer(slug, commit!, ['native'])] : []
  })
  return [offer(repo, head, pinned.length ? [] : ['native']), ...submodules]
}
