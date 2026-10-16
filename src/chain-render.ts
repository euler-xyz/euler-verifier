import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveAddress } from './addresses.js'
import { BuildCache, proveTask } from './prove.js'
import { resolveRpcUrls } from './rpc.js'
import { canonicalProblem, codeAddress } from './verify.js'
import { computeComponentDiffs, type ComponentBaseline } from './run-baselines.js'
import { verifyManifestModules, type ProvenEntry } from './verify-modules.js'
import { verifyManifestSwapManagement } from './verify-swap-management.js'
import { renderReports, writeChainReports, type AuditEntry, type Note, type Outcome, type RenderInputs } from './render-report.js'
import { CONTRACT_SPECS } from './contracts.js'
import type { Manifest, NetworkInfo } from './types.js'

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

const message = (err: unknown): string => (err instanceof Error ? err.message.split('\n')[0]! : String(err))

/**
 * Prove every entry of `chainId` at its own pin, with the same guards as
 * `pnpm verify`: a canonical entry must be a listed exception at its bound
 * address, and a declared proxy must still delegate to the declared
 * implementation. Returns the problem that stops the chain from rendering.
 */
async function chainOutcomes(chainId: number, run: ChainRenderRun): Promise<Outcome[] | string> {
  const outcomes: Outcome[] = []
  for (const [key, entry] of Object.entries(run.manifest[String(chainId)] ?? {})) {
    let address: string | null
    try {
      address = resolveAddress(run.paths.addresses, chainId, key)
    } catch (err) {
      return message(err)
    }
    if (!address) return `${chainId}/${key}: no address under addresses/${chainId}/ or its config/addresses overlay`
    if (entry.verified === 'canonical') {
      const problem = canonicalProblem(chainId, key, address)
      if (problem) return problem
      outcomes.push({ chainId, key, address, status: 'CANONICAL' })
      continue
    }
    if (entry.waiver) {
      outcomes.push({ chainId, key, address, status: 'WAIVED' })
      continue
    }
    let target: string
    try {
      target = await codeAddress(chainId, address, entry, resolveRpcUrls(chainId, run.networks.get(chainId)))
    } catch (err) {
      return `${chainId}/${key}: ${message(err)}`
    }
    const outcome = await proveTask(
      {
        chainId,
        key,
        address: target,
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
    outcomes.push({ ...outcome, address: entry.proxy ? entry.proxy.implementation : address })
  }
  return outcomes
}

type Delegated = { error?: string; modules?: Array<{ module: string; verdict: string }>; verdict?: string }

/** Why a chain's EVault modules or EulerSwap management did not all prove, if they didn't. */
export function delegatedProblems(chainId: number, modules: Record<string, unknown>, swapMgmt: Record<string, unknown>): string[] {
  const problems: string[] = []
  const m = modules[String(chainId)] as Delegated | undefined
  if (m?.error) problems.push(`${chainId}: EVault modules not verified (${m.error.split('\n')[0]})`)
  for (const rec of m?.modules ?? []) {
    if (rec.verdict !== 'MATCH') problems.push(`${chainId}: EVault module ${rec.module} is ${rec.verdict}`)
  }
  const s = swapMgmt[String(chainId)] as Delegated | undefined
  if (s?.error) problems.push(`${chainId}: EulerSwap management not verified (${s.error.split('\n')[0]})`)
  else if (s && s.verdict !== 'MATCH') problems.push(`${chainId}: EulerSwap management is ${s.verdict}`)
  return problems
}

/**
 * Render the reports of `chainIds` into euler-interfaces verify/ and update
 * their rows in verify/README.md; `replaceIndex` rewrites README.md from
 * these chains alone, so it writes nothing unless every chain renders. A
 * chain with any failed proof, delegated-code verification included, is not
 * written. Returns the chains written and the problems of the others.
 */
export async function renderChains(
  chainIds: number[],
  replaceIndex: boolean,
  run: ChainRenderRun,
): Promise<{ rendered: number[]; problems: string[] }> {
  const problems: string[] = []
  const outcomes: Outcome[] = []
  const modules: Record<string, unknown> = {}
  const swapMgmt: Record<string, unknown> = {}
  const rendered: number[] = []
  const entries = run.manifest as unknown as Record<string, Record<string, ProvenEntry>>

  for (const chainId of chainIds) {
    const result = await chainOutcomes(chainId, run)
    if (typeof result === 'string') {
      problems.push(result)
      continue
    }
    const shared = { manifest: entries, addressesDir: run.paths.addresses, networks: run.networks, reposDir: run.reposDir, chains: [chainId] }
    const chainModules = (await verifyManifestModules(shared)).results
    const chainSwap = (await verifyManifestSwapManagement(shared)).results
    const delegated = delegatedProblems(chainId, chainModules, chainSwap)
    if (delegated.length) {
      problems.push(...delegated)
      continue
    }
    outcomes.push(...result)
    Object.assign(modules, chainModules)
    Object.assign(swapMgmt, chainSwap)
    rendered.push(chainId)
  }
  if (rendered.length === 0 || (replaceIndex && problems.length)) return { rendered: [], problems }

  const scoped: Manifest = Object.fromEntries(rendered.map((id) => [String(id), run.manifest[String(id)] ?? {}]))
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
      modules: modules as RenderInputs['modules'],
      swapMgmt: swapMgmt as RenderInputs['swapMgmt'],
      audits: read<AuditEntry[]>(run.paths.audits),
      notes: read<Record<string, Record<string, Note>>>(run.notesPath),
      networks: run.networks,
      engineRef: run.engineRef,
    })
    writeChainReports(run.paths.verifyDir, reports, replaceIndex)
  } finally {
    rmSync(diffsDir, { recursive: true, force: true })
  }
  return { rendered, problems }
}
