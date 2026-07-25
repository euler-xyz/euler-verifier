import { createPublicClient, http, getAddress, parseAbi } from 'viem'
import { buildAtCommit } from './compile.js'
import { compareRuntime, collectImmutableRanges } from './bytecode.js'
import { fetchDeployedCode, resolveRpcUrls } from './rpc.js'
import type { CompileProfile, ImmutableRange, NetworkInfo, VerdictKind } from './types.js'

/**
 * P3 (decision D1): EVault module verification. The implementation
 * (Dispatch) delegatecalls into 8 module contracts whose addresses are
 * public immutables. We read them via getters, cross-check the values
 * against the address words embedded in the implementation's own on-chain
 * immutable ranges, then verify each module's runtime bytecode against the
 * SAME euler-vault-kit build already pinned for the implementation.
 */

export const MODULE_NAMES = [
  'Initialize',
  'Token',
  'Vault',
  'Borrowing',
  'Liquidation',
  'RiskManager',
  'BalanceForwarder',
  'Governance',
] as const
export type ModuleName = (typeof MODULE_NAMES)[number]

const GETTER_BY_MODULE: Record<ModuleName, string> = {
  Initialize: 'MODULE_INITIALIZE',
  Token: 'MODULE_TOKEN',
  Vault: 'MODULE_VAULT',
  Borrowing: 'MODULE_BORROWING',
  Liquidation: 'MODULE_LIQUIDATION',
  RiskManager: 'MODULE_RISKMANAGER',
  BalanceForwarder: 'MODULE_BALANCE_FORWARDER',
  Governance: 'MODULE_GOVERNANCE',
}

const DISPATCH_ABI = parseAbi(
  Object.values(GETTER_BY_MODULE).map((g) => `function ${g}() view returns (address)`) as readonly string[] as never,
)

export async function readModuleAddresses(
  chainId: number,
  implementation: string,
  urls: string[],
): Promise<Record<ModuleName, string>> {
  const failures: string[] = []
  for (const url of urls) {
    try {
      const client = createPublicClient({ transport: http(url, { timeout: 15_000, retryCount: 1 }) })
      const out = {} as Record<ModuleName, string>
      for (const name of MODULE_NAMES) {
        const addr = (await client.readContract({
          address: getAddress(implementation),
          abi: DISPATCH_ABI,
          functionName: GETTER_BY_MODULE[name] as never,
        })) as string
        out[name] = getAddress(addr)
      }
      return out
    } catch (err) {
      failures.push(`${url}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }
  throw new Error(`module getters failed on all endpoints:\n  ${failures.join('\n  ')}`)
}

/**
 * Every 32-byte immutable word in `code` whose top 12 bytes are zero is a
 * plausible embedded address; return the checksummed set. The getter-reported
 * module addresses must all appear here — a getter/bytecode divergence would
 * mean the RPC lied or the offsets are wrong, and must fail loudly.
 */
export function embeddedAddressSet(code: Uint8Array, refs: Record<string, ImmutableRange[]> | null | undefined): Set<string> {
  const out = new Set<string>()
  for (const { start, length } of collectImmutableRanges(refs)) {
    if (length !== 32 || start + length > code.length) continue
    const word = code.subarray(start, start + 32)
    if (word.subarray(0, 12).some((b) => b !== 0)) continue
    const addr = Buffer.from(word.subarray(12)).toString('hex')
    if (addr !== '0'.repeat(40)) out.add(getAddress(`0x${addr}`))
  }
  return out
}

export interface ModuleVerification {
  module: ModuleName
  address: string
  verdict: VerdictKind
  crossCheckedInImplementation: boolean
  strippedSha256?: string
  error?: string
}

export interface VerifyModulesRequest {
  chainId: number
  implementationAddress: string
  /** The proven pin of eVaultImplementation (repo must be euler-vault-kit). */
  repo: string
  commit: string
  profile: CompileProfile | 'native'
  reposDir: string
  networks: Map<number, NetworkInfo>
}

export async function verifyModules(req: VerifyModulesRequest): Promise<ModuleVerification[]> {
  const urls = resolveRpcUrls(req.chainId, req.networks.get(req.chainId))
  const moduleAddrs = await readModuleAddresses(req.chainId, req.implementationAddress, urls)

  // Cross-check getters against the implementation's own embedded immutables.
  const implChain = await fetchDeployedCode(req.chainId, req.implementationAddress, urls)
  const implBuild = await buildAtCommit({
    repo: req.repo,
    commit: req.commit,
    contractName: 'EVault',
    profile: req.profile,
    reposDir: req.reposDir,
  })
  const embedded = embeddedAddressSet(implChain.code, implBuild.immutableReferences)

  const results: ModuleVerification[] = []
  for (const name of MODULE_NAMES) {
    const address = moduleAddrs[name]
    const crossChecked = embedded.has(address)
    try {
      // Same (repo, commit, profile) build — the build-signature cache makes
      // this a pure artifact lookup, not a rebuild.
      const artifact = await buildAtCommit({
        repo: req.repo,
        commit: req.commit,
        contractName: name,
        profile: req.profile,
        reposDir: req.reposDir,
      })
      const { code } = await fetchDeployedCode(req.chainId, address, urls)
      const { match, evidence } = compareRuntime(code, artifact.code, artifact.immutableReferences)
      results.push({
        module: name,
        address,
        verdict: match && crossChecked ? 'MATCH' : 'MISMATCH',
        crossCheckedInImplementation: crossChecked,
        strippedSha256: evidence.strippedChainSha256,
        error: match && !crossChecked ? 'bytecode matches but getter address not found among implementation immutables' : undefined,
      })
    } catch (err) {
      results.push({
        module: name,
        address,
        verdict: 'ERROR',
        crossCheckedInImplementation: crossChecked,
        error: err instanceof Error ? err.message.slice(0, 400) : String(err),
      })
    }
  }
  return results
}
