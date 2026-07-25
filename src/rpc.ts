import { createPublicClient, http, getAddress } from 'viem'
import { fromHex } from './metadata.js'
import type { NetworkInfo } from './types.js'

/**
 * RPC endpoint resolution, following the evk-periphery convention:
 * DEPLOYMENT_RPC_URL_<chainId> from the environment (Doppler-provided) takes
 * precedence; the public defaults from networks.json are fallbacks so that
 * third parties can re-run verification without any secrets.
 */
export function resolveRpcUrls(chainId: number, network: NetworkInfo | undefined, env: NodeJS.ProcessEnv = process.env): string[] {
  const urls: string[] = []
  const fromEnv = env[`DEPLOYMENT_RPC_URL_${chainId}`]
  if (fromEnv && fromEnv.trim()) urls.push(fromEnv.trim())
  for (const u of network?.rpc ?? []) {
    if (!urls.includes(u)) urls.push(u)
  }
  if (urls.length === 0) {
    throw new Error(
      `no RPC endpoint for chain ${chainId}: set DEPLOYMENT_RPC_URL_${chainId} (see .env.example) or add a public default to networks.json`,
    )
  }
  return urls
}

export interface FetchedCode {
  code: Uint8Array
  rpcUrl: string
}

/** Fetch deployed runtime bytecode, trying each endpoint in order. */
export async function fetchDeployedCode(chainId: number, address: string, urls: string[]): Promise<FetchedCode> {
  const failures: string[] = []
  const checksummed = getAddress(address)

  for (const url of urls) {
    try {
      const client = createPublicClient({ transport: http(url, { timeout: 15_000, retryCount: 1 }) })
      const clientChainId = await client.getChainId()
      if (clientChainId !== chainId) {
        failures.push(`${url}: reports chain ${clientChainId}, expected ${chainId}`)
        continue
      }
      const code = await client.getCode({ address: checksummed })
      if (!code || code === '0x') {
        failures.push(`${url}: no code at ${checksummed}`)
        continue
      }
      return { code: fromHex(code), rpcUrl: url }
    } catch (err) {
      failures.push(`${url}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }

  throw new Error(`all RPC endpoints failed for chain ${chainId} / ${checksummed}:\n  ${failures.join('\n  ')}`)
}
