import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import * as viemChains from 'viem/chains'
import type { Chain } from 'viem'
import type { ExplorerVerifier, NetworkInfo } from './types.js'

/** The fields of a euler-interfaces EulerChains.json row the engine reads. */
export interface RegistryChain {
  chainId: number
  name: string
  viemName?: string
  explorerUrl: string
  verifier?: ExplorerVerifier
}

type ViemCatalog = Record<string, unknown>

// Same shape test and resolution order as euler-interfaces scripts/validate-chains.mjs,
// so every chain its CI accepts resolves here too.
function isViemChain(value: unknown): value is Chain {
  if (typeof value !== 'object' || value === null) return false
  const chain = value as Partial<Chain>
  return (
    typeof chain.id === 'number' &&
    typeof chain.name === 'string' &&
    typeof chain.nativeCurrency === 'object' &&
    chain.nativeCurrency !== null &&
    typeof chain.rpcUrls === 'object' &&
    chain.rpcUrls !== null &&
    typeof chain.rpcUrls.default === 'object' &&
    chain.rpcUrls.default !== null
  )
}

export function resolveViemChain(row: Pick<RegistryChain, 'chainId' | 'viemName'>, catalog: ViemCatalog): Chain {
  if (row.viemName !== undefined) {
    const named = Object.hasOwn(catalog, row.viemName) ? catalog[row.viemName] : undefined
    if (isViemChain(named) && named.id === row.chainId) return named
    throw new Error(`viemName "${row.viemName}" is not a viem chain with id ${row.chainId}`)
  }
  const matches = [...new Set(Object.values(catalog).filter((c): c is Chain => isViemChain(c) && c.id === row.chainId))]
  if (matches.length === 1) return matches[0]!
  throw new Error(
    matches.length === 0
      ? `viem has no chain with id ${row.chainId}`
      : `viem has several chains with id ${row.chainId}; set viemName in EulerChains.json`,
  )
}

/** The viem chain's name and default endpoints; a chain viem can't resolve keeps its registry name and no endpoints. */
function fromViem(row: RegistryChain, catalog: ViemCatalog): Pick<NetworkInfo, 'name' | 'rpc' | 'viemProblem'> {
  try {
    const chain = resolveViemChain(row, catalog)
    return { name: chain.name, rpc: [...chain.rpcUrls.default.http] }
  } catch (err) {
    return { name: row.name, rpc: [], viemProblem: err instanceof Error ? err.message : String(err) }
  }
}

export function buildNetworks(registry: RegistryChain[], catalog: ViemCatalog): Map<number, NetworkInfo> {
  return new Map(
    registry.map((row) => {
      const network: NetworkInfo = {
        chainId: row.chainId,
        explorerUrl: row.explorerUrl,
        ...(row.verifier ? { verifier: row.verifier } : {}),
        ...fromViem(row, catalog),
      }
      return [row.chainId, network]
    }),
  )
}

/** Chains from euler-interfaces EulerChains.json; names and RPC endpoints from viem. */
export function loadNetworks(chainsPath: string): Map<number, NetworkInfo> {
  const registry = JSON.parse(readFileSync(chainsPath, 'utf8')) as RegistryChain[]
  return buildNetworks(registry, viemChains)
}

/** `--chains` if given, else the EulerChains.json beside the `--addresses` directory. */
export function chainsPathFor(opts: { chains?: string; addresses?: string }): string {
  if (opts.chains) return resolve(opts.chains)
  if (opts.addresses) return join(dirname(resolve(opts.addresses)), 'EulerChains.json')
  throw new Error('pass --chains <euler-interfaces>/EulerChains.json, or --addresses so it can be found beside it')
}
