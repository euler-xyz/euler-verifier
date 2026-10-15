import { getAddress } from 'viem'
import { buildAtCommit } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, fetchEip1967Implementation, resolveRpcUrls } from './rpc.js'
import { explorerCrossCheck } from './explorer.js'
import { CANONICAL_EXCEPTIONS } from './contracts.js'
import { resolveAddress } from './addresses.js'
import { verifyModules } from './modules.js'
import { verifySwapManagement } from './swap-management.js'
import type { BytecodeEntry, CanonicalEntry, Manifest, ManifestEntry, NetworkInfo, VerificationRecord } from './types.js'

export interface VerifyOptions {
  reposDir: string
  networks: Map<number, NetworkInfo>
  /** Include the untrusted explorer cross-check column. */
  explorer: boolean
}

/** Why a canonical entry may not pass at `address`, or null when it is a listed exception at its bound address. */
export function canonicalProblem(chainId: number, key: string, address: string): string | null {
  const expectedAddress = CANONICAL_EXCEPTIONS[key]?.[chainId]
  if (!expectedAddress) return `canonical entry ${chainId}/${key} is not a listed canonical exception`
  if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
    return `canonical entry ${chainId}/${key} expects ${expectedAddress}, got ${address}`
  }
  return null
}

function canonicalRecord(chainId: number, key: string, address: string, entry: CanonicalEntry): VerificationRecord {
  const base = { chainId, key, address, repo: entry.repo }
  const problem = canonicalProblem(chainId, key, address)
  return problem ? { ...base, verdict: 'ERROR', error: problem } : { ...base, verdict: 'CANONICAL', note: entry.note }
}

/**
 * The address whose code is compared: the entry's own, or the declared
 * implementation behind its proxy, which the proxy's EIP-1967 slot must hold.
 */
export async function codeAddress(chainId: number, address: string, entry: BytecodeEntry, urls: string[]): Promise<string> {
  if (!entry.proxy) return address
  const declaredProxy = getAddress(entry.proxy.address)
  const declaredImplementation = getAddress(entry.proxy.implementation)
  if (declaredProxy !== getAddress(address)) {
    throw new Error(`proxy declared at ${declaredProxy}, but the address under verification is ${getAddress(address)}`)
  }
  const current = getAddress(await fetchEip1967Implementation(chainId, declaredProxy, urls))
  if (current !== declaredImplementation) {
    throw new Error(`proxy ${declaredProxy} delegates to ${current}, but the manifest declares ${declaredImplementation}`)
  }
  return declaredImplementation
}

class StageError extends Error {
  constructor(
    readonly stage: string,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause))
  }
}

async function stage<T>(name: string, run: () => T | Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    throw new StageError(name, err)
  }
}

export async function verifyEntry(
  chainId: number,
  key: string,
  address: string,
  entry: ManifestEntry,
  opts: VerifyOptions,
): Promise<VerificationRecord> {
  if (entry.verified === 'canonical') return canonicalRecord(chainId, key, address, entry)

  const base = { chainId, key, address, repo: entry.repo, commit: entry.commit, contractName: entry.contractName }
  if (entry.waiver) {
    return { ...base, verdict: 'WAIVED', waiver: entry.waiver }
  }

  const network = opts.networks.get(chainId)
  let implementation = {}
  try {
    const urls = await stage('rpc', () => resolveRpcUrls(chainId, network))
    const target = await stage('proxy', () => codeAddress(chainId, address, entry, urls))
    if (target !== address) implementation = { implementation: target }
    const fetched = await stage('rpc', () => fetchDeployedCode(chainId, target, urls))
    const built = await stage('build', () =>
      buildAtCommit({
        repo: entry.repo,
        commit: entry.commit,
        contractName: entry.contractName,
        profile: entry.profile,
        reposDir: opts.reposDir,
        submoduleOverrides: entry.evidence?.submoduleOverrides,
      }),
    )
    const { match, evidence } = compareRuntime(fetched.code, built.code, built.immutableReferences, built.embeddedMetadata)
    const record: VerificationRecord = {
      ...base,
      ...implementation,
      verdict: match ? 'MATCH' : 'MISMATCH',
      evidence,
      rpcUrl: fetched.rpcUrl,
      artifactPath: built.artifactPath,
    }
    return opts.explorer ? { ...record, explorer: await explorerCrossCheck(network, target) } : record
  } catch (err) {
    if (!(err instanceof StageError)) throw err
    return { ...base, ...implementation, verdict: 'ERROR', error: `${err.stage}: ${err.message}` }
  }
}

/**
 * Code reached only through a verified implementation: the eight EVault
 * modules and the EulerSwap V2 management contract, proven from the
 * implementation's pin. Run for implementations that MATCHed.
 */
export async function verifyDelegatedCode(
  chainId: number,
  entries: Record<string, ManifestEntry>,
  matched: Set<string>,
  addressesDir: string,
  opts: VerifyOptions,
): Promise<VerificationRecord[]> {
  const records: VerificationRecord[] = []
  const pinned = (key: string): { entry: BytecodeEntry; address: string } | null => {
    const entry = entries[key]
    const address = resolveAddress(addressesDir, chainId, key)
    return entry && entry.verified !== 'canonical' && matched.has(key) && address ? { entry, address } : null
  }
  const failed = (key: string, err: unknown, entry: BytecodeEntry): VerificationRecord => ({
    chainId,
    key,
    address: '',
    verdict: 'ERROR',
    repo: entry.repo,
    commit: entry.commit,
    error: err instanceof Error ? err.message : String(err),
  })

  const vault = pinned('eVaultImplementation')
  if (vault) {
    const { entry } = vault
    try {
      const modules = await verifyModules({
        chainId,
        implementationAddress: vault.address,
        repo: entry.repo,
        commit: entry.commit,
        profile: entry.profile,
        submoduleOverrides: entry.evidence?.submoduleOverrides,
        reposDir: opts.reposDir,
        networks: opts.networks,
      })
      for (const m of modules) {
        records.push({
          chainId,
          key: `eVaultImplementation/${m.module}`,
          address: m.address,
          verdict: m.verdict,
          repo: entry.repo,
          commit: entry.commit,
          contractName: m.module,
          ...(m.error ? { error: m.error } : {}),
        })
      }
    } catch (err) {
      records.push(failed('eVaultImplementation/modules', err, entry))
    }
  }

  const swap = pinned('eulerSwapV2Implementation')
  if (swap) {
    const { entry } = swap
    try {
      const r = await verifySwapManagement({
        chainId,
        implementationAddress: swap.address,
        repo: entry.repo,
        commit: entry.commit,
        profile: entry.profile,
        submoduleOverrides: entry.evidence?.submoduleOverrides,
        reposDir: opts.reposDir,
        networks: opts.networks,
      })
      records.push({
        chainId,
        key: 'eulerSwapV2Implementation/EulerSwapManagement',
        address: r.managementAddress,
        verdict: r.verdict,
        repo: entry.repo,
        commit: entry.commit,
        contractName: 'EulerSwapManagement',
        ...(r.crossCheckedInImplementation ? {} : { error: 'managementImpl not found among the implementation immutables' }),
      })
    } catch (err) {
      records.push(failed('eulerSwapV2Implementation/EulerSwapManagement', err, entry))
    }
  }
  return records
}

export interface ManifestSelection {
  chainId?: number
  contract?: string
}

export function* iterateManifest(manifest: Manifest, sel: ManifestSelection = {}): Generator<{ chainId: number; key: string; entry: ManifestEntry }> {
  for (const [chainStr, contracts] of Object.entries(manifest)) {
    const chainId = Number(chainStr)
    if (!Number.isInteger(chainId) || chainId <= 0) throw new Error(`manifest: invalid chain id key "${chainStr}"`)
    if (sel.chainId !== undefined && chainId !== sel.chainId) continue
    for (const [key, entry] of Object.entries(contracts)) {
      if (sel.contract !== undefined && key !== sel.contract) continue
      yield { chainId, key, entry }
    }
  }
}
