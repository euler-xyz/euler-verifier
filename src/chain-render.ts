import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveAddress } from './addresses.js'
import { BuildCache, proveTask, type ProveOutcome } from './prove.js'
import { computeComponentDiffs, type ComponentBaseline } from './run-baselines.js'
import { verifyManifestModules, type ProvenEntry } from './verify-modules.js'
import { verifyManifestSwapManagement } from './verify-swap-management.js'
import { renderReports, writeChainReports, type AuditEntry, type Note, type Outcome, type RenderInputs } from './render-report.js'
import { CONTRACT_SPECS } from './contracts.js'
import type { BytecodeEntry, Manifest, NetworkInfo } from './types.js'

export interface InterfacesPaths {
  manifest: string
  addresses: string
  chains: string
  verifyDir: string
  baselines: string
  audits: string
}

export function interfacesPaths(root: string): InterfacesPaths {
  return {
    manifest: join(root, 'verify', 'manifest.json'),
    addresses: join(root, 'addresses'),
    chains: join(root, 'EulerChains.json'),
    verifyDir: join(root, 'verify'),
    baselines: join(root, 'verify', 'baselines.json'),
    audits: join(root, 'verify', 'audits.json'),
  }
}

export interface ChainRenderRun {
  manifest: Manifest
  paths: InterfacesPaths
  networks: Map<number, NetworkInfo>
  reposDir: string
  cache: BuildCache
  cacheDir: string
  notesPath: string
  engineRef?: string
}

/** The address whose code an entry's pin is proven against. */
function codeAddress(entry: BytecodeEntry, address: string): string {
  return entry.proxy && entry.proxy.address.toLowerCase() === address.toLowerCase() ? entry.proxy.implementation : address
}

/** Prove every entry of `chainId` at its own pin, as the full report render does. */
async function chainOutcomes(chainId: number, run: ChainRenderRun): Promise<{ outcomes: Outcome[]; proven: ProveOutcome[] } | string> {
  const outcomes: Outcome[] = []
  const proven: ProveOutcome[] = []
  for (const [key, entry] of Object.entries(run.manifest[String(chainId)] ?? {})) {
    const address = resolveAddress(run.paths.addresses, chainId, key)
    if (!address) return `${chainId}/${key}: no address under addresses/${chainId}/`
    if (entry.verified === 'canonical' || entry.waiver) {
      outcomes.push({ chainId, key, address, status: entry.verified === 'canonical' ? 'CANONICAL' : 'WAIVED' })
      continue
    }
    const outcome = await proveTask(
      {
        chainId,
        key,
        address: codeAddress(entry, address),
        candidates: [
          {
            repo: entry.repo,
            commit: entry.commit,
            contractName: entry.contractName,
            profile: entry.profile,
            recursiveSubmodules: CONTRACT_SPECS[key]?.recursiveSubmodules,
            ...(entry.evidence?.submoduleOverrides ? { submoduleOverrides: entry.evidence.submoduleOverrides } : {}),
            origin: entry.evidence?.origin ?? 'manifest',
          },
        ],
      },
      run.cache,
      { reposDir: run.reposDir, cacheDir: run.cacheDir, networks: run.networks },
    )
    if (outcome.status !== 'PROVEN') {
      return `${chainId}/${key}: ${outcome.status} at its manifest pin (${outcome.error ?? outcome.attempts.map((a) => a.result).join('; ')})`
    }
    outcomes.push(outcome)
    proven.push(outcome)
  }
  return { outcomes, proven }
}

/** Modules and EulerSwap management are built with the profile each implementation was proven with. */
function provenManifest(outcomes: ProveOutcome[]): Record<string, Record<string, ProvenEntry>> {
  const out: Record<string, Record<string, ProvenEntry>> = {}
  for (const o of outcomes) {
    if (o.status !== 'PROVEN' || !o.matched) continue
    const m = o.matched
    const profile = m.profile === 'native' ? { context: 'effective', ...m.effectiveProfile! } : { ...m.profile, context: 'proven' }
    out[String(o.chainId)] = { ...out[String(o.chainId)], [o.key]: { repo: m.repo, commit: m.commit, contractName: m.contractName, profile } }
  }
  return out
}

/**
 * Render the reports of `chainIds` into euler-interfaces verify/ and update
 * their rows in verify/README.md; `replaceIndex` rewrites README.md from
 * these chains alone. Returns the problems that stopped a chain from rendering.
 */
export async function renderChains(chainIds: number[], replaceIndex: boolean, run: ChainRenderRun): Promise<string[]> {
  const problems: string[] = []
  const outcomes: Outcome[] = []
  const provenOutcomes: ProveOutcome[] = []
  const rendered: number[] = []
  for (const chainId of chainIds) {
    const result = await chainOutcomes(chainId, run)
    if (typeof result === 'string') {
      problems.push(result)
      continue
    }
    outcomes.push(...result.outcomes)
    provenOutcomes.push(...result.proven)
    rendered.push(chainId)
  }
  if (rendered.length === 0 || (replaceIndex && problems.length)) return problems

  const scoped: Manifest = Object.fromEntries(rendered.map((id) => [String(id), run.manifest[String(id)] ?? {}]))
  const proven = provenManifest(provenOutcomes)
  const shared = { manifest: proven, addressesDir: run.paths.addresses, networks: run.networks, reposDir: run.reposDir, chains: rendered }
  const modules = await verifyManifestModules(shared)
  const swapMgmt = await verifyManifestSwapManagement(shared)

  const read = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T
  const { components } = read<{ components: ComponentBaseline[] }>(run.paths.baselines)
  const diffsDir = mkdtempSync(join(tmpdir(), 'verifier-diffs-'))
  try {
    const pairs = await computeComponentDiffs(scoped, components, run.reposDir, diffsDir)
    const reports = renderReports({
      manifest: scoped,
      outcomes,
      components,
      pairs,
      diffsDir,
      modules: modules.results as RenderInputs['modules'],
      swapMgmt: swapMgmt.results as RenderInputs['swapMgmt'],
      audits: read<AuditEntry[]>(run.paths.audits),
      notes: read<Record<string, Record<string, Note>>>(run.notesPath),
      networks: run.networks,
      engineRef: run.engineRef,
    })
    writeChainReports(run.paths.verifyDir, reports, replaceIndex)
  } finally {
    rmSync(diffsDir, { recursive: true, force: true })
  }
  return problems
}
