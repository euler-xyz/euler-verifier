import { afterEach, describe, expect, it, vi } from 'vitest'
import { explorerCrossCheck } from '../src/explorer.js'
import type { ExplorerVerifier, NetworkInfo } from '../src/types.js'

const ADDRESS = '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383'

const network = (verifier?: ExplorerVerifier): NetworkInfo => ({
  name: 'Test',
  chainId: 777,
  explorerUrl: 'https://explorer.example',
  ...(verifier ? { verifier } : {}),
  rpc: [],
})

function respond(status: number, body: unknown) {
  const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const SOURCE_FOUND = { status: '1', result: [{ SourceCode: 'contract X {}', ContractName: 'X', CompilerVersion: 'v0.8.24' }] }

afterEach(() => vi.unstubAllGlobals())

describe('explorer cross-check from the registry verifier', () => {
  it('etherscan: queries Etherscan V2 with the chain id and the API key', async () => {
    const fetchMock = respond(200, SOURCE_FOUND)
    const result = await explorerCrossCheck(network({ type: 'etherscan' }), ADDRESS, { ETHERSCAN_API_KEY: 'k' })
    expect(result).toEqual({ status: 'verified', contractName: 'X', compilerVersion: 'v0.8.24' })
    expect(fetchMock.mock.calls[0]![0]).toBe(
      `https://api.etherscan.io/v2/api?chainid=777&module=contract&action=getsourcecode&address=${ADDRESS}&apikey=k`,
    )
  })

  it('blockscout: queries the Etherscan-compatible API at the url', async () => {
    const fetchMock = respond(200, SOURCE_FOUND)
    await explorerCrossCheck(network({ type: 'blockscout', url: 'https://explorer.example/api' }), ADDRESS, {})
    expect(fetchMock.mock.calls[0]![0]).toBe(`https://explorer.example/api?module=contract&action=getsourcecode&address=${ADDRESS}`)
  })

  it('custom: queries the Etherscan-compatible API at the url', async () => {
    const fetchMock = respond(200, { status: '1', result: [{ SourceCode: '' }] })
    const url = 'https://api.routescan.io/v2/network/mainnet/evm/777/etherscan'
    expect(await explorerCrossCheck(network({ type: 'custom', url }), ADDRESS, {})).toEqual({ status: 'unverified' })
    expect(fetchMock.mock.calls[0]![0]).toBe(`${url}?module=contract&action=getsourcecode&address=${ADDRESS}`)
  })

  it('sourcify: queries the v2 API at the url', async () => {
    const fetchMock = respond(200, { match: 'match', compilation: { name: 'X', compilerVersion: '0.8.24+commit.e11b9ed9' } })
    const result = await explorerCrossCheck(network({ type: 'sourcify', url: 'https://sourcify.example' }), ADDRESS, {})
    expect(result).toEqual({ status: 'verified', contractName: 'X', compilerVersion: '0.8.24+commit.e11b9ed9' })
    expect(fetchMock.mock.calls[0]![0]).toBe(`https://sourcify.example/v2/contract/777/${ADDRESS}?fields=compilation`)
  })

  it('sourcify: defaults to sourcify.dev and reads a 404 as unverified', async () => {
    const fetchMock = respond(404, { match: null })
    expect(await explorerCrossCheck(network({ type: 'sourcify' }), ADDRESS, {})).toEqual({ status: 'unverified' })
    expect(fetchMock.mock.calls[0]![0]).toBe(`https://sourcify.dev/server/v2/contract/777/${ADDRESS}?fields=compilation`)
  })

  it('VERIFIER_URL_<id> replaces the API base', async () => {
    const fetchMock = respond(200, SOURCE_FOUND)
    await explorerCrossCheck(network({ type: 'etherscan' }), ADDRESS, { VERIFIER_URL_777: 'https://proxy.example/api', VERIFIER_API_KEY_777: 'own' })
    expect(fetchMock.mock.calls[0]![0]).toBe(
      `https://proxy.example/api?chainid=777&module=contract&action=getsourcecode&address=${ADDRESS}&apikey=own`,
    )
  })

  it('stays informational: no verifier, API errors and network failures are "unavailable"', async () => {
    expect((await explorerCrossCheck(network(), ADDRESS, {})).status).toBe('unavailable')
    respond(200, { status: '0', result: 'Missing/Invalid API Key' })
    expect(await explorerCrossCheck(network({ type: 'etherscan' }), ADDRESS, {})).toEqual({ status: 'unavailable', detail: 'Missing/Invalid API Key' })
    respond(503, {})
    expect(await explorerCrossCheck(network({ type: 'blockscout', url: 'https://explorer.example/api' }), ADDRESS, {})).toEqual({
      status: 'unavailable',
      detail: 'HTTP 503',
    })
  })
})
