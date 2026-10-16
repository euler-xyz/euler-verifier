#!/usr/bin/env tsx
/**
 * Add the verify/manifest.json entries euler-interfaces is missing, proven
 * against the deployed bytecode, and render the affected chains' reports.
 *
 *   pnpm add-entries --interfaces <euler-interfaces> [--chain <id>]... \
 *     [--candidates-from <deploying checkout>]... [--candidate <repo>@<sha>]... [--render]
 */
import { parseArgs } from 'node:util'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAddress } from 'viem'
import { addressChainIds, assertRegistryCurrent } from './addresses.js'
import { CANONICAL_EXCEPTIONS, CONTRACT_SPECS } from './contracts.js'
import { loadNetworks } from './networks.js'
import { BuildCache, proveTask, type ProveOutcome } from './prove.js'
import { fetchEip1967Implementation, resolveRpcUrls } from './rpc.js'
import { formatManifest } from './manifest-file.js'
import { interfacesPaths, renderChains } from './chain-render.js'
import { checkoutCommits, explicitCandidates, manifestCandidates, parseCandidateArg, type Candidate, type ExplicitCommit } from './candidates.js'
import { isEntrypoint } from './entrypoint.js'
import { codeAddress } from './verify.js'
import { findWork, type Work } from './manifest-work.js'
import type { BytecodeEntry, Manifest, NetworkInfo, ProxyDeclaration } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const HELP = `Add the verify/manifest.json entries euler-interfaces is missing, and render their reports.

Usage:
  pnpm add-entries --interfaces <euler-interfaces checkout> [options]

Addresses are the ones consumers receive: addresses/<chainId>/ with the
config/addresses/<chainId>/ overlay, as in EulerChains.json (which must be
current: run node chains.js first). Every allowlisted contract without a
manifest entry, or whose entry was proven at another address (a redeploy), is
proven against candidate pins: the commits given below first, then the entry's
own pin, then the pins other chains use for the same contract. Entries are
written to verify/manifest.json with the address they were proven at, and each
affected chain's verify/<chainId>.md and its row in verify/README.md are
rendered. Contracts that no candidate proves are listed with every candidate
tried, and nothing is written for them. Entries from before addresses were
recorded are re-proven at their current address once and stamped.

Options:
  --interfaces <dir>        euler-interfaces checkout. Required.
  --chain <id>              Only this chain; repeatable (default: every chain with address files).
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

Exit code: 0 if every entry was added, regenerated or stamped and its chain rendered; 1 otherwise.`

type Item = Pick<Work, 'chainId' | 'key' | 'address'>

/** For a contract other chains declare behind a proxy, the implementation its EIP-1967 slot holds. */
async function proxyTarget(m: Item, candidates: Candidate[], network: NetworkInfo | undefined): Promise<ProxyDeclaration | null> {
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

function entryFor(c: Candidate, outcome: ProveOutcome, address: string, proxy: ProxyDeclaration | null): Record<string, unknown> {
  const matched = outcome.matched!
  const profile = c.profile ?? (matched.effectiveProfile ? { context: 'native', ...matched.effectiveProfile } : undefined)
  if (!profile) throw new Error(`${outcome.chainId}/${outcome.key}: the build reported no compiler settings to record`)
  const overrides = c.prove.submoduleOverrides
  return {
    commit: c.prove.commit,
    contractName: c.prove.contractName,
    evidence: {
      address,
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

/** The entry's own pin, as a candidate for re-proving it at the current address. */
function ownCandidate(chainId: number, key: string, entry: BytecodeEntry): Candidate {
  return {
    source: entry,
    profile: entry.profile,
    prove: {
      repo: entry.repo,
      commit: entry.commit,
      contractName: entry.contractName,
      profile: entry.profile,
      recursiveSubmodules: CONTRACT_SPECS[key]?.recursiveSubmodules,
      ...(entry.evidence?.submoduleOverrides ? { submoduleOverrides: entry.evidence.submoduleOverrides } : {}),
      origin: entry.evidence?.origin ?? `manifest:${chainId}`,
    },
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
  assertRegistryCurrent(paths.chains, paths.addresses)
  const networks = loadNetworks(paths.chains)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const cacheDir = values['cache-dir'] ? resolve(values['cache-dir']) : join(ROOT, 'repos', 'build-cache')
  const cache = new BuildCache(cacheDir, reposDir)

  const deployed = addressChainIds(paths.addresses)
  const chainIds = values.chain?.map(Number) ?? deployed
  const unknown = chainIds.filter((id) => !deployed.includes(id))
  if (unknown.length) {
    console.error(`no addresses/<chainId>/ or config/addresses/<chainId>/ folder for chain(s) ${unknown.join(', ')}`)
    return 1
  }

  const work = findWork(manifest, paths.addresses, chainIds)
  if (work.length === 0) {
    console.log('every deployed allowlisted contract has a manifest entry proven at its current address')
    if (!values.render) return 0
  }

  const explicit: ExplicitCommit[] = [
    ...(await Promise.all((values['candidates-from'] ?? []).map((dir) => checkoutCommits(resolve(dir))))).flat(),
    ...(values.candidate ?? []).map((arg) => ({ ...parseCandidateArg(arg), profiles: ['native' as const], manifestProfiles: true, origin: 'candidate' })),
  ]
  const proveOpts = { reposDir, cacheDir, networks, log: (line: string) => console.log(line) }

  let next = manifest
  const set = (m: Item, entry: unknown) => {
    const chain = String(m.chainId)
    next = { ...next, [chain]: { ...next[chain], [m.key]: entry as Manifest[string][string] } }
  }
  const added: Item[] = []
  let stamped = 0
  const unproven: Array<{ missing: Item; attempts: ProveOutcome['attempts']; reason?: string }> = []
  for (const w of work) {
    console.log(`\n${w.chainId}/${w.key} @ ${w.address} (${w.kind})`)
    if (w.kind === 'unstamped' && w.entry) {
      const urls = resolveRpcUrls(w.chainId, networks.get(w.chainId))
      const target = await codeAddress(w.chainId, w.address, w.entry, urls).catch(() => null)
      const own = ownCandidate(w.chainId, w.key, w.entry)
      const outcome = target ? await proveTask({ chainId: w.chainId, key: w.key, address: target, candidates: [own.prove] }, cache, proveOpts) : null
      if (outcome?.status === 'PROVEN') {
        set(w, { ...w.entry, evidence: { ...w.entry.evidence, address: w.address } })
        stamped++
        continue
      }
      if (outcome?.status === 'RPC_ERROR') {
        unproven.push({ missing: w, attempts: [], reason: outcome.error })
        continue
      }
      console.log('  its pin no longer proves at this address: regenerating')
    }
    if (CANONICAL_EXCEPTIONS[w.key]?.[w.chainId]) {
      unproven.push({ missing: w, attempts: [], reason: 'a canonical exception, documented by a note instead of a proof' })
      continue
    }
    const own = w.entry ? [ownCandidate(w.chainId, w.key, w.entry)] : []
    const candidates = [...explicitCandidates(manifest, w.key, explicit), ...own, ...manifestCandidates(next, w.chainId, w.key)]
    if (candidates.length === 0) {
      unproven.push({ missing: w, attempts: [], reason: 'no candidate pins: pass --candidates-from or --candidate' })
      continue
    }
    const proxy = await proxyTarget(w, candidates, networks.get(w.chainId))
    const outcome = await proveTask(
      { chainId: w.chainId, key: w.key, address: proxy?.implementation ?? w.address, candidates: candidates.map((c) => c.prove) },
      cache,
      proveOpts,
    )
    const winner = outcome.matched && candidates.find((c) => sameCandidate(c, outcome.matched!))
    if (outcome.status !== 'PROVEN' || !winner) {
      unproven.push({ missing: w, attempts: outcome.attempts, reason: outcome.error })
      continue
    }
    set(w, entryFor(winner, outcome, w.address, proxy))
    added.push(w)
  }

  if (added.length || stamped) writeFileSync(paths.manifest, formatManifest(next))
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

  console.log(`\nadded or regenerated ${added.length} entr${added.length === 1 ? 'y' : 'ies'}: ${added.map((m) => `${m.chainId}/${m.key}`).join(', ') || 'none'}`)
  if (stamped) console.log(`recorded the proven address of ${stamped} existing entr${stamped === 1 ? 'y' : 'ies'}`)
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
