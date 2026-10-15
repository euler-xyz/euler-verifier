import { getAddress } from 'viem'
import { buildAtCommit } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, fetchEip1967Implementation, resolveRpcUrls } from './rpc.js'
import { explorerCrossCheck } from './explorer.js'
import { CANONICAL_EXCEPTIONS } from './contracts.js'
import type { BytecodeEntry, CanonicalEntry, Manifest, ManifestEntry, NetworkInfo, VerificationRecord } from './types.js'

export interface VerifyOptions {
  reposDir: string
  networks: Map<number, NetworkInfo>
  /** Include the untrusted explorer cross-check column. */
  explorer: boolean
}

function canonicalRecord(chainId: number, key: string, address: string, entry: CanonicalEntry): VerificationRecord {
  const base = { chainId, key, address, repo: entry.repo }
  const expectedAddress = CANONICAL_EXCEPTIONS[key]?.[chainId]
  if (!expectedAddress) {
    return { ...base, verdict: 'ERROR', error: `canonical entry ${chainId}/${key} is not a listed canonical exception` }
  }
  if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
    return { ...base, verdict: 'ERROR', error: `canonical entry ${chainId}/${key} expects ${expectedAddress}, got ${address}` }
  }
  return { ...base, verdict: 'CANONICAL', note: entry.note }
}

/** The address whose code is compared: the entry's own, or the declared implementation behind its proxy. */
async function codeAddress(chainId: number, address: string, entry: BytecodeEntry, urls: string[]): Promise<string> {
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
    const { match, evidence } = compareRuntime(fetched.code, built.code, built.immutableReferences)
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
