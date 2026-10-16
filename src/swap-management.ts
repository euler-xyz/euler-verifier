import { createPublicClient, http, getAddress, parseAbi } from 'viem'
import { buildAtCommit } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, resolveRpcUrls } from './rpc.js'
import { embeddedAddressSet } from './modules.js'
import type { CompileProfile, NetworkInfo, SubmoduleOverride } from './types.js'

const ABI = parseAbi(['function managementImpl() view returns (address)'])

async function readManagementAddress(implementation: string, urls: string[]): Promise<string> {
  const failures: string[] = []
  for (const url of urls) {
    try {
      const client = createPublicClient({ transport: http(url, { timeout: 15_000, retryCount: 1 }) })
      const addr = (await client.readContract({
        address: getAddress(implementation),
        abi: ABI,
        functionName: 'managementImpl',
      })) as string
      return getAddress(addr)
    } catch (err) {
      failures.push(`${url}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }
  throw new Error(`managementImpl() failed on all endpoints:\n  ${failures.join('\n  ')}`)
}

export interface SwapManagementRequest {
  chainId: number
  implementationAddress: string
  /** The proven pin of eulerSwapV2Implementation. */
  repo: string
  commit: string
  profile: CompileProfile
  submoduleOverrides?: SubmoduleOverride[]
  reposDir: string
  networks: Map<number, NetworkInfo>
}

export interface SwapManagementResult {
  implementation: string
  managementAddress: string
  pin: string
  verdict: 'MATCH' | 'MISMATCH'
  crossCheckedInImplementation: boolean
  strippedSha256?: string
}

/**
 * EulerSwap V2 delegatecalls management functions into a separate
 * EulerSwapManagement contract whose address is the public immutable
 * `managementImpl`: read it, cross-check it against the implementation's
 * embedded immutable words, then prove its code from the implementation's
 * pin. Throws on RPC or build failures.
 */
export async function verifySwapManagement(req: SwapManagementRequest): Promise<SwapManagementResult> {
  const urls = resolveRpcUrls(req.chainId, req.networks.get(req.chainId))
  const managementAddress = await readManagementAddress(req.implementationAddress, urls)
  const build = (contractName: string) =>
    buildAtCommit({
      repo: req.repo,
      commit: req.commit,
      contractName,
      profile: req.profile,
      reposDir: req.reposDir,
      submoduleOverrides: req.submoduleOverrides,
    })

  const implChain = await fetchDeployedCode(req.chainId, req.implementationAddress, urls)
  const implBuild = await build('EulerSwap')
  const crossChecked = embeddedAddressSet(implChain.code, implBuild.immutableReferences).has(managementAddress)

  const artifact = await build('EulerSwapManagement')
  const { code } = await fetchDeployedCode(req.chainId, managementAddress, urls)
  const { match, evidence } = compareRuntime(code, artifact.code, artifact.immutableReferences, artifact.embeddedMetadata)
  return {
    implementation: req.implementationAddress,
    managementAddress,
    pin: `${req.repo}@${req.commit}`,
    verdict: match && crossChecked ? 'MATCH' : 'MISMATCH',
    crossCheckedInImplementation: crossChecked,
    strippedSha256: evidence.strippedChainSha256,
  }
}
