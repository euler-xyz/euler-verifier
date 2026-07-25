import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NetworkInfo } from './types.js'

interface RawNetwork {
  chain_id: number
  name: string
  status: string
  explorer_url: string
  explorer_api: string
  api_type: string
  rpc?: string[]
}

export function loadNetworks(rootDir: string): Map<number, NetworkInfo> {
  const raw = JSON.parse(readFileSync(join(rootDir, 'networks.json'), 'utf8')) as Record<string, RawNetwork>
  const out = new Map<number, NetworkInfo>()
  for (const [key, n] of Object.entries(raw)) {
    out.set(n.chain_id, {
      key,
      name: n.name,
      chainId: n.chain_id,
      status: n.status,
      explorerUrl: n.explorer_url,
      explorerApi: n.explorer_api,
      apiType: n.api_type,
      rpc: n.rpc ?? [],
    })
  }
  return out
}
