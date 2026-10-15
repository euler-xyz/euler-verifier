import { describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('viem/chains', () => ({
  alpha: { id: 7001, name: 'Alpha', nativeCurrency: {}, rpcUrls: { default: { http: ['https://rpc.alpha.example'] } } },
}))

import { buildNetworks, chainsPathFor, loadNetworks, resolveViemChain, type RegistryChain } from '../src/networks.js'
import { resolveRpcUrls } from '../src/rpc.js'

function viemChain(id: number, name: string, http: string[]) {
  return { id, name, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http } } }
}

const CATALOG = {
  one: viemChain(1, 'One', ['https://rpc.one.example']),
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
  it('takes name, explorer and verifier from EulerChains.json and RPCs from viem', () => {
    const networks = buildNetworks([row(1, { verifier: { type: 'blockscout', url: 'https://explorer1.example/api' } })], {}, CATALOG)
    expect(networks.get(1)).toEqual({
      chainId: 1,
      name: 'chain1',
      explorerUrl: 'https://explorer1.example',
      verifier: { type: 'blockscout', url: 'https://explorer1.example/api' },
      rpc: ['https://rpc.one.example'],
    })
  })

  it('knows only the chains the registry lists', () => {
    const networks = buildNetworks([row(1)], { other: { chain_id: 3, rpc: ['https://override.example'] } }, CATALOG)
    expect([...networks.keys()]).toEqual([1])
  })

  it('loads EulerChains.json and networks.json from disk, with viem/chains for RPCs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-networks-'))
    try {
      writeFileSync(join(dir, 'EulerChains.json'), JSON.stringify([row(7001, { name: 'alpha', safeBaseUrl: 'ignored' } as Partial<RegistryChain>)]))
      writeFileSync(join(dir, 'networks.json'), JSON.stringify({ alpha: { chain_id: 7001, name: 'Alpha Mainnet' } }))
      const networks = loadNetworks(join(dir, 'EulerChains.json'), join(dir, 'networks.json'))
      expect(networks.get(7001)).toMatchObject({ name: 'Alpha Mainnet', rpc: ['https://rpc.alpha.example'] })
      expect(loadNetworks(join(dir, 'EulerChains.json'), join(dir, 'absent.json')).get(7001)?.name).toBe('alpha')
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
  })

  it('uses the unique chain with the id when viemName is absent', () => {
    expect(resolveViemChain({ chainId: 3 }, CATALOG).name).toBe('Three')
  })

  it('rejects an id several viem chains share, an unknown id and a mismatched viemName', () => {
    expect(() => resolveViemChain({ chainId: 2 }, CATALOG)).toThrow(/several chains with id 2/)
    expect(() => resolveViemChain({ chainId: 4 }, CATALOG)).toThrow(/no chain with id 4/)
    expect(() => resolveViemChain({ chainId: 3, viemName: 'one' }, CATALOG)).toThrow(/not a viem chain with id 3/)
  })

  it('keeps an unresolvable chain, without endpoints, and says why', () => {
    const network = buildNetworks([row(2)], {}, CATALOG).get(2)
    expect(network?.rpc).toEqual([])
    expect(() => resolveRpcUrls(2, network, {})).toThrow(/several chains with id 2.*networks\.json/)
  })
})

describe('networks.json overrides', () => {
  const overrides = {
    one: { chain_id: 1, name: 'One Mainnet', rpc: ['https://override-one.example', 'https://override-one-b.example'] },
    three: { chain_id: 3, name: 'Three Chain' },
  }
  const networks = buildNetworks([row(1), row(3), row(2, { viemName: 'twin' })], overrides, CATALOG)

  it('replaces the name and viem RPCs where set', () => {
    expect(networks.get(1)).toMatchObject({ name: 'One Mainnet', rpc: ['https://override-one.example', 'https://override-one-b.example'] })
  })

  it('keeps viem RPCs when the override sets only a name', () => {
    expect(networks.get(3)).toMatchObject({ name: 'Three Chain', rpc: ['https://rpc.three.example'] })
  })

  it('runs a chain without an override from the registry and viem alone', () => {
    expect(networks.get(2)).toMatchObject({ name: 'chain2', rpc: ['https://rpc.twin.example'] })
  })

  it('still puts DEPLOYMENT_RPC_URL_<id> first', () => {
    expect(resolveRpcUrls(1, networks.get(1), { DEPLOYMENT_RPC_URL_1: 'https://private.example' })).toEqual([
      'https://private.example',
      'https://override-one.example',
      'https://override-one-b.example',
    ])
  })
})
