import { describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('viem/chains', () => ({
  alpha: { id: 7001, name: 'Alpha Mainnet', nativeCurrency: {}, rpcUrls: { default: { http: ['https://rpc.alpha.example'] } } },
}))

import { buildNetworks, chainsPathFor, loadNetworks, resolveViemChain, type RegistryChain } from '../src/networks.js'
import { resolveRpcUrls } from '../src/rpc.js'

function viemChain(id: number, name: string, http: string[]) {
  return { id, name, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http } } }
}

const CATALOG = {
  one: viemChain(1, 'One', ['https://rpc.one.example', 'https://rpc-b.one.example']),
  twin: viemChain(2, 'Twin', ['https://rpc.twin.example']),
  twinTestnet: viemChain(2, 'Twin Testnet', ['https://rpc.twin-testnet.example']),
  three: viemChain(3, 'Three', ['https://rpc.three.example']),
  notAChain: { id: 4 },
}

const row = (chainId: number, extra: Partial<RegistryChain> = {}): RegistryChain => ({
  chainId,
  name: `chain${chainId}`,
  explorerUrl: `https://explorer${chainId}.example`,
  verifier: { type: 'etherscan' },
  ...extra,
})

describe('chains from the registry', () => {
  it('takes explorer and verifier from EulerChains.json, and name and RPCs from viem', () => {
    const networks = buildNetworks([row(1, { verifier: { type: 'blockscout', url: 'https://explorer1.example/api' } })], CATALOG)
    expect(networks.get(1)).toEqual({
      chainId: 1,
      name: 'One',
      explorerUrl: 'https://explorer1.example',
      verifier: { type: 'blockscout', url: 'https://explorer1.example/api' },
      rpc: ['https://rpc.one.example', 'https://rpc-b.one.example'],
    })
  })

  it('knows only the chains the registry lists', () => {
    expect([...buildNetworks([row(1), row(3)], CATALOG).keys()]).toEqual([1, 3])
  })

  it('loads EulerChains.json from disk and resolves it against viem/chains', () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-networks-'))
    try {
      writeFileSync(join(dir, 'EulerChains.json'), JSON.stringify([row(7001, { name: 'alpha', safeBaseUrl: 'ignored' } as Partial<RegistryChain>)]))
      expect(loadNetworks(join(dir, 'EulerChains.json')).get(7001)).toMatchObject({
        name: 'Alpha Mainnet',
        rpc: ['https://rpc.alpha.example'],
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('finds EulerChains.json beside --addresses unless --chains is given', () => {
    expect(chainsPathFor({ addresses: '/x/euler-interfaces/addresses' })).toBe('/x/euler-interfaces/EulerChains.json')
    expect(chainsPathFor({ chains: '/y/EulerChains.json', addresses: '/x/addresses' })).toBe('/y/EulerChains.json')
    expect(() => chainsPathFor({})).toThrow(/--chains/)
  })
})

describe('viem chain resolution', () => {
  it('uses viemName when set', () => {
    expect(resolveViemChain({ chainId: 2, viemName: 'twinTestnet' }, CATALOG).name).toBe('Twin Testnet')
    expect(buildNetworks([row(2, { viemName: 'twin' })], CATALOG).get(2)).toMatchObject({ name: 'Twin', rpc: ['https://rpc.twin.example'] })
  })

  it('uses the unique chain with the id when viemName is absent', () => {
    expect(resolveViemChain({ chainId: 3 }, CATALOG).name).toBe('Three')
  })

  it('rejects an id several viem chains share, an unknown id and a mismatched viemName', () => {
    expect(() => resolveViemChain({ chainId: 2 }, CATALOG)).toThrow(/several chains with id 2/)
    expect(() => resolveViemChain({ chainId: 4 }, CATALOG)).toThrow(/no chain with id 4/)
    expect(() => resolveViemChain({ chainId: 3, viemName: 'one' }, CATALOG)).toThrow(/not a viem chain with id 3/)
  })

  it('keeps an unresolvable chain under its registry name, without endpoints, and says why', () => {
    const network = buildNetworks([row(2)], CATALOG).get(2)
    expect(network).toMatchObject({ name: 'chain2', rpc: [] })
    expect(() => resolveRpcUrls(2, network, {})).toThrow(/several chains with id 2.*DEPLOYMENT_RPC_URL_2/)
  })
})

describe('RPC endpoints', () => {
  const network = buildNetworks([row(1)], CATALOG).get(1)

  it('puts DEPLOYMENT_RPC_URL_<id> before viem defaults', () => {
    expect(resolveRpcUrls(1, network, { DEPLOYMENT_RPC_URL_1: 'https://private.example' })).toEqual([
      'https://private.example',
      'https://rpc.one.example',
      'https://rpc-b.one.example',
    ])
  })

  it('uses viem defaults alone when no env URL is set', () => {
    expect(resolveRpcUrls(1, network, {})).toEqual(['https://rpc.one.example', 'https://rpc-b.one.example'])
  })

  it('works from DEPLOYMENT_RPC_URL_<id> alone for a chain viem cannot resolve', () => {
    expect(resolveRpcUrls(2, buildNetworks([row(2)], CATALOG).get(2), { DEPLOYMENT_RPC_URL_2: 'https://private.example' })).toEqual([
      'https://private.example',
    ])
  })
})
