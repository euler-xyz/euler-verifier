import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as viemChains from 'viem/chains'
import type { Chain } from 'viem'
import type { ExplorerVerifier, NetworkInfo } from './types.js'

export const DEFAULT_OVERRIDES = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'networks.json')

/** The fields of a euler-interfaces EulerChains.json row the engine reads. */
export interface RegistryChain {
  chainId: number
  name: string
  viemName?: string
  explorerUrl: string
  verifier?: ExplorerVerifier
}

export interface NetworkOverride {
  chain_id: number
  name?: string
  rpc?: string[]
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

function viemEndpoints(row: RegistryChain, catalog: ViemCatalog): { rpc: string[]; viemProblem?: string } {
  try {
    return { rpc: [...resolveViemChain(row, catalog).rpcUrls.default.http] }
  } catch (err) {
    return { rpc: [], viemProblem: err instanceof Error ? err.message : String(err) }
  }
}

export function buildNetworks(
  registry: RegistryChain[],
  overrides: Record<string, NetworkOverride>,
  catalog: ViemCatalog,
): Map<number, NetworkInfo> {
  const overrideFor = new Map(Object.values(overrides).map((o) => [o.chain_id, o]))
  return new Map(
    registry.map((row) => {
      const override = overrideFor.get(row.chainId)
      const endpoints = override?.rpc?.length ? { rpc: [...override.rpc] } : viemEndpoints(row, catalog)
      const network: NetworkInfo = {
        name: override?.name ?? row.name,
        chainId: row.chainId,
        explorerUrl: row.explorerUrl,
        ...(row.verifier ? { verifier: row.verifier } : {}),
        ...endpoints,
      }
      return [row.chainId, network]
    }),
  )
}

/** Chains from euler-interfaces EulerChains.json, RPCs from viem, with networks.json as optional overrides. */
export function loadNetworks(chainsPath: string, overridesPath: string = DEFAULT_OVERRIDES): Map<number, NetworkInfo> {
  const registry = JSON.parse(readFileSync(chainsPath, 'utf8')) as RegistryChain[]
  const overrides = existsSync(overridesPath)
    ? (JSON.parse(readFileSync(overridesPath, 'utf8')) as Record<string, NetworkOverride>)
    : {}
  return buildNetworks(registry, overrides, viemChains)
}

/** `--chains` if given, else the EulerChains.json beside the `--addresses` directory. */
export function chainsPathFor(opts: { chains?: string; addresses?: string }): string {
  if (opts.chains) return resolve(opts.chains)
  if (opts.addresses) return join(dirname(resolve(opts.addresses)), 'EulerChains.json')
  throw new Error('pass --chains <euler-interfaces>/EulerChains.json, or --addresses so it can be found beside it')
}
