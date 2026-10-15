import { createPublicClient, http, getAddress, type PublicClient } from 'viem'
import { fromHex } from './metadata.js'
import type { NetworkInfo } from './types.js'

/**
 * RPC endpoint resolution, following the evk-periphery convention:
 * DEPLOYMENT_RPC_URL_<chainId> from the environment (optional) takes
 * precedence; viem's default public endpoints for the chain are fallbacks so
 * that third parties can re-run verification without any secrets.
 */
export function resolveRpcUrls(chainId: number, network: NetworkInfo | undefined, env: NodeJS.ProcessEnv = process.env): string[] {
  const urls: string[] = []
  const fromEnv = env[`DEPLOYMENT_RPC_URL_${chainId}`]
  if (fromEnv && fromEnv.trim()) urls.push(fromEnv.trim())
  for (const u of network?.rpc ?? []) {
    if (!urls.includes(u)) urls.push(u)
  }
  if (urls.length === 0) {
    const why = network ? (network.viemProblem ?? 'no endpoints') : 'not in EulerChains.json'
    throw new Error(
      `no RPC endpoint for chain ${chainId} (${why}): set DEPLOYMENT_RPC_URL_${chainId} (see .env.example)`,
    )
  }
  return urls
}

export interface FetchedCode {
  code: Uint8Array
  rpcUrl: string
}

async function readFirstEndpoint<T>(
  chainId: number,
  urls: string[],
  subject: string,
  read: (client: PublicClient) => Promise<T>,
): Promise<{ value: T; rpcUrl: string }> {
  const failures: string[] = []

  for (const url of urls) {
    try {
      const client = createPublicClient({ transport: http(url, { timeout: 15_000, retryCount: 1 }) })
      const clientChainId = await client.getChainId()
      if (clientChainId !== chainId) {
        failures.push(`${url}: reports chain ${clientChainId}, expected ${chainId}`)
        continue
      }
      return { value: await read(client), rpcUrl: url }
    } catch (err) {
      failures.push(`${url}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }

  throw new Error(`all RPC endpoints failed for chain ${chainId} / ${subject}:\n  ${failures.join('\n  ')}`)
}

/** Fetch deployed runtime bytecode, trying each endpoint in order. */
export async function fetchDeployedCode(chainId: number, address: string, urls: string[]): Promise<FetchedCode> {
  const checksummed = getAddress(address)
  const { value, rpcUrl } = await readFirstEndpoint(chainId, urls, checksummed, async (client) => {
    const code = await client.getCode({ address: checksummed })
    if (!code || code === '0x') throw new Error(`no code at ${checksummed}`)
    return fromHex(code)
  })
  return { code: value, rpcUrl }
}

/** bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1) */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

export async function fetchEip1967Implementation(chainId: number, proxy: string, urls: string[]): Promise<string> {
  const checksummed = getAddress(proxy)
  const { value } = await readFirstEndpoint(chainId, urls, `${checksummed} implementation slot`, async (client) => {
    const word = await client.getStorageAt({ address: checksummed, slot: EIP1967_IMPLEMENTATION_SLOT })
    if (!word || BigInt(word) === 0n) throw new Error(`empty EIP-1967 implementation slot at ${checksummed}`)
    return getAddress(`0x${word.slice(-40)}`)
  })
  return value
}
