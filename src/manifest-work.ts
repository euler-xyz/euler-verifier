import { readdirSync } from 'node:fs'
import { resolveAddress } from './addresses.js'
import { CONTRACT_SPECS } from './contracts.js'
import type { BytecodeEntry, Manifest } from './types.js'

/**
 * What `add-entries` has to do for one deployed contract:
 * - `missing`: no manifest entry;
 * - `stale`: the entry was proven at another address (`evidence.address`), so the contract was redeployed;
 * - `unstamped`: the entry predates `evidence.address`; it is re-proven at the current address and stamped,
 *   or regenerated when its pin no longer proves.
 */
export interface Work {
  kind: 'missing' | 'stale' | 'unstamped'
  chainId: number
  key: string
  address: string
  entry?: BytecodeEntry
}

export function deployedChains(addressesDir: string): number[] {
  return readdirSync(addressesDir)
    .filter((d) => /^\d+$/.test(d))
    .map(Number)
    .sort((a, b) => a - b)
}

export function findWork(manifest: Manifest, addressesDir: string, chainIds: number[]): Work[] {
  return chainIds.flatMap((chainId) =>
    Object.keys(CONTRACT_SPECS).flatMap((key): Work[] => {
      const address = resolveAddress(addressesDir, chainId, key)
      if (!address) return []
      const entry = manifest[String(chainId)]?.[key]
      if (!entry) return [{ kind: 'missing', chainId, key, address }]
      if (entry.verified === 'canonical' || entry.waiver) return []
      const proven = entry.evidence?.address
      if (proven === undefined) return [{ kind: 'unstamped', chainId, key, address, entry }]
      return proven.toLowerCase() === address.toLowerCase() ? [] : [{ kind: 'stale', chainId, key, address, entry }]
    }),
  )
}

/** Entries whose `evidence.address` is not the contract's current address. */
export function staleEntries(manifest: Manifest, addressesDir: string): Array<{ chainId: number; key: string; address: string; proven: string }> {
  return Object.entries(manifest).flatMap(([chain, entries]) =>
    Object.entries(entries).flatMap(([key, entry]) => {
      const proven = entry.verified === 'canonical' ? undefined : entry.evidence?.address
      const address = resolveAddress(addressesDir, Number(chain), key)
      return proven && address && proven.toLowerCase() !== address.toLowerCase()
        ? [{ chainId: Number(chain), key, address, proven }]
        : []
    }),
  )
}
