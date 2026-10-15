#!/usr/bin/env tsx
/**
 * Add the verify/manifest.json entries euler-interfaces is missing, proven
 * against the deployed bytecode, and render the affected chains' reports.
 *
 *   pnpm add-entries --interfaces <euler-interfaces> [--chain <id>]... \
 *     [--candidates-from <deploying checkout>]... [--candidate <repo>@<sha>]... [--render]
 */
import { parseArgs } from 'node:util'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAddress } from 'viem'
import { resolveAddress } from './addresses.js'
import { CANONICAL_EXCEPTIONS, CONTRACT_SPECS } from './contracts.js'
import { loadNetworks } from './networks.js'
import { BuildCache, proveTask, type ProveOutcome } from './prove.js'
import { fetchEip1967Implementation, resolveRpcUrls } from './rpc.js'
import { formatManifest } from './manifest-file.js'
import { interfacesPaths, renderChains } from './chain-render.js'
import { checkoutCommits, explicitCandidates, manifestCandidates, parseCandidateArg, type Candidate, type ExplicitCommit } from './candidates.js'
import { isEntrypoint } from './entrypoint.js'
import type { Manifest, NetworkInfo, ProxyDeclaration } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const HELP = `Add the verify/manifest.json entries euler-interfaces is missing, and render their reports.

Usage:
  pnpm add-entries --interfaces <euler-interfaces checkout> [options]

Every allowlisted contract under addresses/<chainId>/ without a manifest entry
is proven against candidate pins: the commits given below first, then the pins
other chains use for the same contract. Proven entries are written to
verify/manifest.json, and each affected chain's verify/<chainId>.md and its row
in verify/README.md are rendered. Contracts that no candidate proves are listed
with every candidate tried, and nothing is written for them.

Options:
  --interfaces <dir>        euler-interfaces checkout. Required.
  --chain <id>              Only this chain; repeatable (default: every chain under addresses/).
  --candidates-from <dir>   A deploying checkout (e.g. evk-periphery): its HEAD commit and its
                            submodule commits become candidates, built with its foundry profile.
                            Repeatable.
  --candidate <repo>@<sha>  Another candidate commit, e.g. euler-xyz/euler-earn@<40-hex sha>
                            (owner defaults to euler-xyz). Repeatable.
  --repos-dir <dir>         Engine-managed source checkouts (default: <repo>/repos/engine).
  --cache-dir <dir>         Build cache (default: <repo>/repos/build-cache).
  --render                  Also render the selected chains that miss nothing. Without --chain this
                            is a full render: every report and all of verify/README.md.
  --engine-ref <label>      Footer label of rendered reports (default: master).

Exit code: 0 if every missing entry was added and its chain rendered; 1 otherwise.`

interface Missing {
  chainId: number
  key: string
  address: string
}

function deployedChains(addressesDir: string): number[] {
  return readdirSync(addressesDir)
    .filter((d) => /^\d+$/.test(d))
    .map(Number)
    .sort((a, b) => a - b)
}

function findMissing(manifest: Manifest, addressesDir: string, chainIds: number[]): Missing[] {
  return chainIds.flatMap((chainId) =>
    Object.keys(CONTRACT_SPECS).flatMap((key) => {
      const address = resolveAddress(addressesDir, chainId, key)
      return address && !manifest[String(chainId)]?.[key] ? [{ chainId, key, address }] : []
    }),
  )
}

/** For a contract other chains declare behind a proxy, the implementation its EIP-1967 slot holds. */
async function proxyTarget(m: Missing, candidates: Candidate[], network: NetworkInfo | undefined): Promise<ProxyDeclaration | null> {
  const type = candidates.find((c) => c.source?.proxy)?.source?.proxy?.type
  if (!type) return null
  const implementation = await fetchEip1967Implementation(m.chainId, m.address, resolveRpcUrls(m.chainId, network)).catch(() => null)
  return implementation ? { address: m.address, implementation, type } : null
}

function sameCandidate(c: Candidate, matched: NonNullable<ProveOutcome['matched']>): boolean {
  const fields = (p: Candidate['prove']) =>
    JSON.stringify([p.repo, p.commit, p.contractName, p.profile, p.submoduleOverrides ?? [], p.origin])
  return fields(c.prove) === fields(matched)
}

function entryFor(c: Candidate, outcome: ProveOutcome, proxy: ProxyDeclaration | null): Record<string, unknown> {
  const matched = outcome.matched!
  const profile = c.profile ?? (matched.effectiveProfile ? { context: 'native', ...matched.effectiveProfile } : undefined)
  if (!profile) throw new Error(`${outcome.chainId}/${outcome.key}: the build reported no compiler settings to record`)
  const overrides = c.prove.submoduleOverrides
  return {
    commit: c.prove.commit,
    contractName: c.prove.contractName,
    evidence: {
      codeSize: outcome.chainCodeSize,
      origin: c.prove.origin,
      strippedSha256: outcome.strippedSha256,
      ...(overrides ? { submoduleOverrides: overrides } : {}),
    },
    profile,
    ...(proxy ? { proxy } : {}),
    repo: c.prove.repo,
    verified: 'bytecode',
    waiver: null,
  }
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      interfaces: { type: 'string' },
      chain: { type: 'string', multiple: true },
      'candidates-from': { type: 'string', multiple: true },
      candidate: { type: 'string', multiple: true },
      'repos-dir': { type: 'string' },
      'cache-dir': { type: 'string' },
      render: { type: 'boolean', default: false },
      'engine-ref': { type: 'string', default: 'master' },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help || !values.interfaces) {
    console.log(HELP)
    return values.help ? 0 : 1
  }

  const paths = interfacesPaths(resolve(values.interfaces))
  const manifest = JSON.parse(readFileSync(paths.manifest, 'utf8')) as Manifest
  const networks = loadNetworks(paths.chains)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const cacheDir = values['cache-dir'] ? resolve(values['cache-dir']) : join(ROOT, 'repos', 'build-cache')
  const cache = new BuildCache(cacheDir, reposDir)

  const chainIds = values.chain?.map(Number) ?? deployedChains(paths.addresses)
  const unknown = chainIds.filter((id) => !existsSync(join(paths.addresses, String(id))))
  if (unknown.length) {
    console.error(`no addresses/<chainId>/ folder for chain(s) ${unknown.join(', ')}`)
    return 1
  }

  const missing = findMissing(manifest, paths.addresses, chainIds)
  if (missing.length === 0) {
    console.log('every deployed allowlisted contract already has a manifest entry')
    if (!values.render) return 0
  }

  const explicit: ExplicitCommit[] = [
    ...(await Promise.all((values['candidates-from'] ?? []).map((dir) => checkoutCommits(resolve(dir))))).flat(),
    ...(values.candidate ?? []).map((arg) => ({ ...parseCandidateArg(arg), profiles: ['native' as const], manifestProfiles: true, origin: 'candidate' })),
  ]

  let next = manifest
  const added: Missing[] = []
  const unproven: Array<{ missing: Missing; attempts: ProveOutcome['attempts']; reason?: string }> = []
  for (const m of missing) {
    console.log(`\n${m.chainId}/${m.key} @ ${m.address}`)
    if (CANONICAL_EXCEPTIONS[m.key]?.[m.chainId]) {
      unproven.push({ missing: m, attempts: [], reason: 'a canonical exception, documented by a note instead of a proof' })
      continue
    }
    const candidates = [...explicitCandidates(manifest, m.key, explicit), ...manifestCandidates(next, m.chainId, m.key)]
    if (candidates.length === 0) {
      unproven.push({ missing: m, attempts: [], reason: 'no candidate pins: pass --candidates-from or --candidate' })
      continue
    }
    const proxy = await proxyTarget(m, candidates, networks.get(m.chainId))
    const outcome = await proveTask(
      { chainId: m.chainId, key: m.key, address: proxy?.implementation ?? m.address, candidates: candidates.map((c) => c.prove) },
      cache,
      { reposDir, cacheDir, networks, log: (line) => console.log(line) },
    )
    const winner = outcome.matched && candidates.find((c) => sameCandidate(c, outcome.matched!))
    if (outcome.status !== 'PROVEN' || !winner) {
      unproven.push({ missing: m, attempts: outcome.attempts, reason: outcome.error })
      continue
    }
    const chain = String(m.chainId)
    next = { ...next, [chain]: { ...next[chain], [m.key]: entryFor(winner, outcome, proxy) as unknown as Manifest[string][string] } }
    added.push(m)
  }

  if (added.length) writeFileSync(paths.manifest, formatManifest(next))
  const renderedChains = values.render ? chainIds : [...new Set(added.map((m) => m.chainId))]
  const renderProblems = renderedChains.length
    ? await renderChains(renderedChains, values.render && !values.chain, {
        manifest: next,
        paths,
        networks,
        reposDir,
        cache,
        cacheDir,
        notesPath: join(ROOT, 'manifests', 'attention-notes.json'),
        engineRef: values['engine-ref'],
      })
    : []

  console.log(`\nadded ${added.length} entr${added.length === 1 ? 'y' : 'ies'}: ${added.map((m) => `${m.chainId}/${m.key}`).join(', ') || 'none'}`)
  for (const { missing: m, attempts, reason } of unproven) {
    console.log(`NOT PROVEN ${m.chainId}/${m.key} @ ${getAddress(m.address)}${reason ? `: ${reason}` : ''}`)
    for (const a of attempts) console.log(`  tried ${a.candidate} (${a.origin}): ${a.result}`)
  }
  for (const p of renderProblems) console.log(`NOT RENDERED ${p}`)
  return unproven.length || renderProblems.length ? 1 : 0
}

if (isEntrypoint(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err))
      process.exit(1)
    },
  )
}
