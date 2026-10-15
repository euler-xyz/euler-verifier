import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { getAddress } from 'viem'

vi.mock('../src/compile.js', () => ({ buildAtCommit: vi.fn() }))
vi.mock('../src/rpc.js', () => ({
  resolveRpcUrls: vi.fn(() => ['http://rpc.invalid']),
  fetchDeployedCode: vi.fn(),
  fetchEip1967Implementation: vi.fn(),
}))

import { buildAtCommit } from '../src/compile.js'
import { fetchDeployedCode, fetchEip1967Implementation } from '../src/rpc.js'
import { fromHex } from '../src/metadata.js'
import { verifyEntry, type VerifyOptions } from '../src/verify.js'
import type { BytecodeEntry, CanonicalEntry } from '../src/types.js'

const execFileAsync = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const RUNTIME = fromHex('0x6080604052348015600e575f80fd5b50')
const OPTS: VerifyOptions = { reposDir: '/nonexistent', networks: new Map(), explorer: false }

// Mainnet eulOFTAdapter as declared in manifests/manifest.json (2026-07-25).
const PROXY = '0x4d7e09f73843Bd4735AaF7A74b6d877bac75a531'
const IMPLEMENTATION = '0x3Bf1bD5DB4457d22A85d45791B6291b98D0fC5b5'

const CANONICAL_EUL: CanonicalEntry = {
  repo: 'euler-xyz/euler-governance',
  verified: 'canonical',
  note: 'canonical 2021 EUL token',
}

function bytecodeEntry(overrides: Partial<BytecodeEntry> = {}): BytecodeEntry {
  return {
    repo: 'euler-xyz/reward-streams',
    commit: '9eb7b8a7fa31c275d688063c4abd07165b50b89f',
    contractName: 'TrackingRewardStreams',
    profile: { context: 'native', solc: '0.8.24', optimizer_runs: 100000, evm_version: 'cancun' },
    verified: 'bytecode',
    waiver: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchDeployedCode).mockResolvedValue({ code: RUNTIME, rpcUrl: 'http://rpc.invalid' })
  vi.mocked(buildAtCommit).mockResolvedValue({
    code: RUNTIME,
    immutableReferences: {},
    artifactPath: 'out/Artifact.json',
    repoDir: '/nonexistent',
    sources: [],
  })
})

describe('canonical manifest entries', () => {
  it.each([
    '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b',
    '0xd9fcd98c322942075a5c3860693e9f4f03aae07b',
  ])('reports the canonical address %s without fetching or building', async (address) => {
    const record = await verifyEntry(1, 'EUL', address, CANONICAL_EUL, OPTS)
    expect(record).toMatchObject({ verdict: 'CANONICAL', note: CANONICAL_EUL.note })
    expect(fetchDeployedCode).not.toHaveBeenCalled()
    expect(buildAtCommit).not.toHaveBeenCalled()
  })

  it.each([
    '0x0000000000000000000000000000000000000001',
    'not-an-address',
  ])('rejects a different canonical address: %s', async (address) => {
    const record = await verifyEntry(1, 'EUL', address, CANONICAL_EUL, OPTS)
    expect(record.verdict).toBe('ERROR')
    expect(fetchDeployedCode).not.toHaveBeenCalled()
    expect(buildAtCommit).not.toHaveBeenCalled()
  })

  it('rejects a canonical entry that is not a listed exception', async () => {
    const record = await verifyEntry(8453, 'EUL', '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b', CANONICAL_EUL, OPTS)
    expect(record.verdict).toBe('ERROR')
    expect(record.error).toMatch(/not a listed canonical exception/)
  })

  it('CLI fails when the address registry replaces the canonical token', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-canonical-address-'))
    try {
      const manifestPath = join(dir, 'manifest.json')
      const addressesDir = join(dir, 'addresses')
      mkdirSync(join(addressesDir, '1'), { recursive: true })
      writeFileSync(manifestPath, JSON.stringify({ '1': { EUL: CANONICAL_EUL } }))
      writeFileSync(join(addressesDir, '1', 'TokenAddresses.json'), JSON.stringify({
        EUL: '0x0000000000000000000000000000000000000001',
      }))
      const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
      await expect(execFileAsync(tsx, [
        'src/cli.ts', '--manifest', manifestPath, '--addresses', addressesDir, '--chain', '1', '--no-explorer',
      ], { cwd: ROOT, timeout: 60_000 })).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringContaining('summary: {"ERROR":1} -> FAILED'),
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('CLI verifies a commit-less canonical entry instead of crashing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-canonical-'))
    try {
      const manifestPath = join(dir, 'manifest.json')
      const manifest = { '1': { EUL: { ...CANONICAL_EUL, address: '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b' } } }
      writeFileSync(manifestPath, JSON.stringify(manifest))
      const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
      const { stdout } = await execFileAsync(tsx, ['src/cli.ts', '--manifest', manifestPath, '--chain', '1', '--no-explorer'], {
        cwd: ROOT,
        timeout: 60_000,
      })
      expect(stdout).toContain('against euler-xyz/euler-governance (canonical)')
      expect(stdout).toContain('summary: {"CANONICAL":1} -> OK')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('declared submodule pins', () => {
  it('builds with the submodule refs recorded in the entry', async () => {
    const submoduleOverrides = [
      { path: 'lib/ethereum-vault-connector', ref: 'dc3be15' },
      { path: 'lib/openzeppelin-contracts', ref: 'v5.1.0' },
    ]
    const record = await verifyEntry(130, 'balanceTracker', IMPLEMENTATION, bytecodeEntry({ evidence: { submoduleOverrides } }), OPTS)
    expect(record.verdict).toBe('MATCH')
    expect(buildAtCommit).toHaveBeenCalledWith(expect.objectContaining({ submoduleOverrides }))
  })

  it('builds at the gitlinks when the entry records no refs', async () => {
    await verifyEntry(1, 'balanceTracker', IMPLEMENTATION, bytecodeEntry(), OPTS)
    expect(vi.mocked(buildAtCommit).mock.calls[0]?.[0].submoduleOverrides).toBeUndefined()
  })
})

describe('declared proxies', () => {
  const proxied = bytecodeEntry({
    repo: 'euler-xyz/evk-periphery',
    contractName: 'OFTAdapterUpgradeable',
    proxy: { address: PROXY, implementation: IMPLEMENTATION, type: 'TransparentUpgradeableProxy (EIP-1967)' },
  })

  it('proves the declared implementation the proxy delegates to', async () => {
    vi.mocked(fetchEip1967Implementation).mockResolvedValue(IMPLEMENTATION)
    const record = await verifyEntry(1, 'eulOFTAdapter', PROXY, proxied, OPTS)
    expect(record).toMatchObject({ verdict: 'MATCH', address: PROXY, implementation: getAddress(IMPLEMENTATION) })
    expect(fetchEip1967Implementation).toHaveBeenCalledWith(1, PROXY, ['http://rpc.invalid'])
    expect(fetchDeployedCode).toHaveBeenCalledWith(1, getAddress(IMPLEMENTATION), ['http://rpc.invalid'])
  })

  it('fails when the proxy delegates to a different implementation', async () => {
    vi.mocked(fetchEip1967Implementation).mockResolvedValue('0x0000000000000000000000000000000000000001')
    const record = await verifyEntry(1, 'eulOFTAdapter', PROXY, proxied, OPTS)
    expect(record.verdict).toBe('ERROR')
    expect(record.error).toMatch(/^proxy: .* delegates to 0x0000000000000000000000000000000000000001/)
    expect(buildAtCommit).not.toHaveBeenCalled()
  })

  it('fails when the declaration names another proxy address', async () => {
    const record = await verifyEntry(1, 'eulOFTAdapter', IMPLEMENTATION, proxied, OPTS)
    expect(record.verdict).toBe('ERROR')
    expect(record.error).toMatch(/^proxy: proxy declared at/)
    expect(fetchEip1967Implementation).not.toHaveBeenCalled()
  })
})
