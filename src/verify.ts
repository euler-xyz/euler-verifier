import { buildAtCommit } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, resolveRpcUrls } from './rpc.js'
import { explorerCrossCheck } from './explorer.js'
import type { Manifest, ManifestEntry, NetworkInfo, VerificationRecord } from './types.js'

export interface VerifyOptions {
  reposDir: string
  networks: Map<number, NetworkInfo>
  /** Include the untrusted explorer cross-check column. */
  explorer: boolean
}

export async function verifyEntry(
  chainId: number,
  key: string,
  address: string,
  entry: ManifestEntry,
  opts: VerifyOptions,
): Promise<VerificationRecord> {
  const base = {
    chainId,
    key,
    address,
    repo: entry.repo,
    commit: entry.commit,
    contractName: entry.contractName,
  }

  if (entry.waiver) {
    return { ...base, verdict: 'WAIVED', waiver: entry.waiver }
  }

  const network = opts.networks.get(chainId)

  let fetched
  try {
    const urls = resolveRpcUrls(chainId, network)
    fetched = await fetchDeployedCode(chainId, address, urls)
  } catch (err) {
    return { ...base, verdict: 'ERROR', error: `rpc: ${err instanceof Error ? err.message : String(err)}` }
  }

  let built
  try {
    built = await buildAtCommit({
      repo: entry.repo,
      commit: entry.commit,
      contractName: entry.contractName,
      profile: entry.profile,
      reposDir: opts.reposDir,
    })
  } catch (err) {
    return { ...base, verdict: 'ERROR', error: `build: ${err instanceof Error ? err.message : String(err)}` }
  }

  const { match, evidence } = compareRuntime(fetched.code, built.code, built.immutableReferences)

  const record: VerificationRecord = {
    ...base,
    verdict: match ? 'MATCH' : 'MISMATCH',
    evidence,
    rpcUrl: fetched.rpcUrl,
    artifactPath: built.artifactPath,
  }

  if (opts.explorer) {
    record.explorer = await explorerCrossCheck(network, address)
  }

  return record
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
