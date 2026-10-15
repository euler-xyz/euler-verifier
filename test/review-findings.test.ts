import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

vi.mock('../src/rpc.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/rpc.js')>()),
  fetchEip1967Implementation: vi.fn(),
}))
vi.mock('../src/prove.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/prove.js')>()),
  proveTask: vi.fn(),
}))
vi.mock('../src/verify-modules.js', () => ({ verifyManifestModules: vi.fn() }))
vi.mock('../src/verify-swap-management.js', () => ({ verifyManifestSwapManagement: vi.fn() }))
vi.mock('../src/modules.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules.js')>()),
  verifyModules: vi.fn(),
}))
vi.mock('../src/swap-management.js', () => ({ verifySwapManagement: vi.fn() }))

import { fetchEip1967Implementation } from '../src/rpc.js'
import { BuildCache, proveTask } from '../src/prove.js'
import { verifyManifestModules } from '../src/verify-modules.js'
import { verifyManifestSwapManagement } from '../src/verify-swap-management.js'
import { verifyModules } from '../src/modules.js'
import { verifySwapManagement } from '../src/swap-management.js'
import { resolveAddress, staleRegistryChains } from '../src/addresses.js'
import { ensureRepoCheckout } from '../src/compile.js'
import { interfacesPaths, renderChains } from '../src/chain-render.js'
import { findWork, staleEntries } from '../src/manifest-work.js'
import { verifyDelegatedCode } from '../src/verify.js'
import { buildNetworks } from '../src/networks.js'
import * as viemChains from 'viem/chains'
import type { BytecodeEntry, Manifest } from '../src/types.js'

const execFileAsync = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx')
const FIXTURE_CHAINS = join(ROOT, 'test', 'fixtures', 'EulerChains.json')

const EUL = '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b'
const PROXY = '0x4d7e09f73843Bd4735AaF7A74b6d877bac75a531'
const IMPLEMENTATION = '0x3bf1bD5dB4457d22A85D45791b6291b98d0Fc5b5'
const SWAP_VERIFIER = '0x93A732A1900697d5f51C77fe09275486BB0bb83D'
const OTHER = '0x0000000000000000000000000000000000000001'
const SHA = (c: string) => c.repeat(40)

const dirs: string[] = []
const tempDir = (prefix: string) => {
  const d = mkdtempSync(join(tmpdir(), prefix))
  dirs.push(d)
  return d
}
const write = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2))
}

function bytecodeEntry(extra: Partial<BytecodeEntry> = {}): BytecodeEntry {
  return {
    repo: 'euler-xyz/evk-periphery',
    commit: SHA('a'),
    contractName: 'SwapVerifier',
    profile: { context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 20000, evm_version: 'cancun' },
    verified: 'bytecode',
    waiver: null,
    ...extra,
  }
}

/** A euler-interfaces checkout with the given address files, manifest and rendered README. */
function interfaces(files: Record<string, unknown>, manifest: Manifest): string {
  const root = tempDir('verifier-interfaces-')
  write(join(root, 'EulerChains.json'), JSON.parse(readFileSync(FIXTURE_CHAINS, 'utf8')))
  for (const [path, value] of Object.entries(files)) write(join(root, path), value)
  write(join(root, 'verify', 'manifest.json'), manifest)
  write(join(root, 'verify', 'baselines.json'), { components: [] })
  write(join(root, 'verify', 'audits.json'), [])
  write(join(root, 'verify', 'README.md'), '# rendered before\n')
  return root
}

function run(root: string, manifest: Manifest) {
  const paths = interfacesPaths(root)
  return {
    manifest,
    paths,
    networks: buildNetworks(JSON.parse(readFileSync(paths.chains, 'utf8')), viemChains),
    reposDir: join(root, 'repos'),
    cache: new BuildCache(join(root, 'cache'), join(root, 'repos')),
    cacheDir: join(root, 'cache'),
    notesPath: join(ROOT, 'manifests', 'attention-notes.json'),
  }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('finding 2: the verified address is the published one', () => {
  it('applies the config/addresses overlay, as EulerChains.json does', () => {
    const root = interfaces(
      {
        'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER },
        'config/addresses/8453/PeripheryAddresses.json': { swapVerifier: OTHER },
      },
      {},
    )
    expect(resolveAddress(join(root, 'addresses'), 8453, 'swapVerifier')).toBe(OTHER)
  })

  it('detects an EulerChains.json that lags the address files', () => {
    const root = interfaces({ 'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }, {})
    const rows = [{ chainId: 8453, name: 'base', explorerUrl: 'https://basescan.org', addresses: { peripheryAddrs: { swapVerifier: OTHER } } }]
    write(join(root, 'EulerChains.json'), rows)
    expect(staleRegistryChains(join(root, 'EulerChains.json'), join(root, 'addresses'))).toEqual([8453])
    write(join(root, 'EulerChains.json'), [{ ...rows[0], addresses: { peripheryAddrs: { swapVerifier: SWAP_VERIFIER } } }])
    expect(staleRegistryChains(join(root, 'EulerChains.json'), join(root, 'addresses'))).toEqual([])
  })

  it('the verify CLI rejects a manifest address override', async () => {
    const root = interfaces({ 'addresses/1/TokenAddresses.json': { EUL } }, {})
    const manifest = { '1': { EUL: { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'n', address: EUL } } }
    write(join(root, 'verify', 'manifest.json'), manifest)
    const cli = execFileAsync(TSX, ['src/cli.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses'), '--chain', '1', '--no-explorer'], {
      cwd: ROOT,
      timeout: 60_000,
    })
    await expect(cli).rejects.toMatchObject({ code: 1, stdout: expect.stringContaining('manifest address overrides are not allowed') })
  })

  it('validate-manifests rejects a manifest address override', async () => {
    const root = interfaces({}, {})
    write(join(root, 'manifest.json'), { '8453': { swapVerifier: { ...bytecodeEntry(), address: SWAP_VERIFIER } } })
    const validate = execFileAsync(TSX, ['src/validate-manifests.ts', '--manifest', join(root, 'manifest.json')], { cwd: ROOT, timeout: 60_000 })
    await expect(validate).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('address overrides are not allowed') })
  })
})

describe('finding 3: add-entries renders with the same guards as verify', () => {
  it('a canonical entry at the wrong address stops the chain and writes nothing', async () => {
    const manifest: Manifest = { '1': { EUL: { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'n' } } }
    const root = interfaces({ 'addresses/1/TokenAddresses.json': { EUL: OTHER } }, manifest)
    const problems = await renderChains([1], true, run(root, manifest))
    expect(problems.join('\n')).toMatch(/expects 0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b/)
    expect(existsSync(join(root, 'verify', '1.md'))).toBe(false)
    expect(readFileSync(join(root, 'verify', 'README.md'), 'utf8')).toBe('# rendered before\n')
  })

  it('add-entries --render exits non-zero on it', async () => {
    const manifest: Manifest = { '1': { EUL: { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'n' } } }
    const root = interfaces({ 'addresses/1/TokenAddresses.json': { EUL: OTHER } }, manifest)
    const cli = execFileAsync(TSX, ['src/add-entries.ts', '--interfaces', root, '--render'], { cwd: ROOT, timeout: 60_000 })
    await expect(cli).rejects.toMatchObject({ code: 1, stdout: expect.stringContaining('NOT RENDERED') })
    expect(readFileSync(join(root, 'verify', 'README.md'), 'utf8')).toBe('# rendered before\n')
  })

  it('a proxy that no longer delegates to the declared implementation stops the chain', async () => {
    vi.mocked(fetchEip1967Implementation).mockResolvedValue(OTHER)
    const manifest: Manifest = {
      '1': { eulOFTAdapter: bytecodeEntry({ contractName: 'OFTAdapterUpgradeable', proxy: { address: PROXY, implementation: IMPLEMENTATION } }) },
    }
    const root = interfaces({ 'addresses/1/BridgeAddresses.json': { eulOFTAdapter: PROXY } }, manifest)
    const problems = await renderChains([1], false, run(root, manifest))
    expect(problems.join('\n')).toMatch(/delegates to 0x0000000000000000000000000000000000000001/)
    expect(proveTask).not.toHaveBeenCalled()
    expect(existsSync(join(root, 'verify', '1.md'))).toBe(false)
  })
})

describe('finding 4: delegated-code failures are never dropped', () => {
  const manifest: Manifest = { '8453': { swapVerifier: bytecodeEntry() } }
  const proven = {
    chainId: 8453,
    key: 'swapVerifier',
    address: SWAP_VERIFIER,
    status: 'PROVEN' as const,
    matched: { ...bytecodeEntry(), origin: 'manifest', sources: [] },
    strippedSha256: 'ab',
    attempts: [],
  }

  it('an RPC error in module verification stops the chain and writes nothing', async () => {
    vi.mocked(proveTask).mockResolvedValue(proven)
    vi.mocked(verifyManifestModules).mockResolvedValue({ results: { '8453': { error: 'rpc: all RPC endpoints failed' } }, ok: false })
    vi.mocked(verifyManifestSwapManagement).mockResolvedValue({ results: {}, ok: true })
    const root = interfaces({ 'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }, manifest)
    const problems = await renderChains([8453], false, run(root, manifest))
    expect(problems).toEqual(['8453: EVault modules not verified (rpc: all RPC endpoints failed)'])
    expect(existsSync(join(root, 'verify', '8453.md'))).toBe(false)
  })

  it('a build error in EulerSwap management verification stops the chain and writes nothing', async () => {
    vi.mocked(proveTask).mockResolvedValue(proven)
    vi.mocked(verifyManifestModules).mockResolvedValue({ results: {}, ok: true })
    vi.mocked(verifyManifestSwapManagement).mockResolvedValue({ results: { '8453': { error: 'forge build src failed' } }, ok: false })
    const root = interfaces({ 'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }, manifest)
    const problems = await renderChains([8453], false, run(root, manifest))
    expect(problems).toEqual(['8453: EulerSwap management not verified (forge build src failed)'])
    expect(existsSync(join(root, 'verify', '8453.md'))).toBe(false)
  })

  it('verify reports delegated RPC and build errors as ERROR records', async () => {
    vi.mocked(verifyModules).mockRejectedValue(new Error('rpc: all RPC endpoints failed'))
    vi.mocked(verifySwapManagement).mockRejectedValue(new Error('build: forge build src failed'))
    const root = interfaces(
      { 'addresses/8453/CoreAddresses.json': { eVaultImplementation: OTHER }, 'addresses/8453/EulerSwapAddresses.json': { eulerSwapV2Implementation: OTHER } },
      {},
    )
    const entries = { eVaultImplementation: bytecodeEntry({ contractName: 'EVault' }), eulerSwapV2Implementation: bytecodeEntry({ contractName: 'EulerSwap' }) }
    const records = await verifyDelegatedCode(8453, entries, new Set(Object.keys(entries)), join(root, 'addresses'), {
      reposDir: root,
      networks: new Map(),
      explorer: false,
    })
    expect(records.map((r) => [r.key, r.verdict, r.error])).toEqual([
      ['eVaultImplementation/modules', 'ERROR', 'rpc: all RPC endpoints failed'],
      ['eulerSwapV2Implementation/EulerSwapManagement', 'ERROR', 'build: forge build src failed'],
    ])
  })
})

describe('finding 5: every pin is a full commit', () => {
  it('validate-manifests rejects tag and short-SHA submodule overrides', async () => {
    const root = interfaces({}, {})
    const overrides = [
      { path: 'lib/openzeppelin-contracts', ref: 'v5.1.0' },
      { path: 'lib/ethereum-vault-connector', ref: 'dc3be15' },
    ]
    write(join(root, 'manifest.json'), { '8453': { swapVerifier: bytecodeEntry({ evidence: { submoduleOverrides: overrides } }) } })
    const validate = execFileAsync(TSX, ['src/validate-manifests.ts', '--manifest', join(root, 'manifest.json')], { cwd: ROOT, timeout: 60_000 })
    await expect(validate).rejects.toMatchObject({ code: 1, stderr: expect.stringMatching(/ref "v5.1.0" is not a full 40-hex SHA[\s\S]*ref "dc3be15"/) })
  })

  it('validate-manifests rejects a baseline that is not a full commit', async () => {
    const root = interfaces({}, {})
    write(join(root, 'baselines.json'), { components: [{ component: 'evc', baseline: { commit: 'v1.0' }, lastAudit: { finalReviewedCommit: SHA('b') } }] })
    const validate = execFileAsync(TSX, ['src/validate-manifests.ts', '--baselines', join(root, 'baselines.json')], { cwd: ROOT, timeout: 60_000 })
    await expect(validate).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('baseline.commit "v1.0"') })
  })
})

describe('finding 6: reused checkouts are clean and from the expected origin', () => {
  async function git(cwd: string, ...args: string[]) {
    return (await execFileAsync('git', args, { cwd })).stdout.trim()
  }

  async function engineClone(): Promise<{ reposDir: string; dir: string; commit: string }> {
    const upstream = tempDir('verifier-upstream-')
    await git(upstream, 'init', '-q')
    write(join(upstream, 'src', 'A.sol'), 'contract A {}\n')
    await git(upstream, 'add', '.')
    await git(upstream, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'a')
    const commit = await git(upstream, 'rev-parse', 'HEAD')
    const reposDir = tempDir('verifier-repos-')
    const dir = join(reposDir, 'repo')
    await execFileAsync('git', ['clone', '-q', upstream, dir])
    await git(dir, 'remote', 'set-url', 'origin', 'https://github.com/euler-xyz/repo.git')
    return { reposDir, dir, commit }
  }

  it('removes an untracked Solidity file and reverts edits before a build', async () => {
    const { reposDir, dir, commit } = await engineClone()
    write(join(dir, 'src', 'Evil.sol'), 'contract Evil {}\n')
    write(join(dir, 'src', 'A.sol'), 'contract A { uint256 x; }\n')
    await ensureRepoCheckout({ repo: 'euler-xyz/repo', commit, reposDir, recursiveSubmodules: false })
    expect(existsSync(join(dir, 'src', 'Evil.sol'))).toBe(false)
    expect(readFileSync(join(dir, 'src', 'A.sol'), 'utf8')).toBe('contract A {}\n')
  })

  it('refuses a reused clone whose origin is another repository', async () => {
    const { reposDir, dir, commit } = await engineClone()
    await git(dir, 'remote', 'set-url', 'origin', 'https://github.com/someone-else/repo.git')
    await expect(ensureRepoCheckout({ repo: 'euler-xyz/repo', commit, reposDir, recursiveSubmodules: false })).rejects.toThrow(
      /has origin https:\/\/github.com\/someone-else\/repo.git, expected https:\/\/github.com\/euler-xyz\/repo.git/,
    )
  })
})

describe('finding 7: redeployed contracts are regenerated', () => {
  const files = { 'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }

  it('an entry proven at another address is stale; one proven here is not', () => {
    const root = interfaces(files, {})
    const addresses = join(root, 'addresses')
    const at = (address: string): Manifest => ({ '8453': { swapVerifier: bytecodeEntry({ evidence: { address } }) } })
    expect(findWork(at(OTHER), addresses, [8453]).map((w) => w.kind)).toEqual(['stale'])
    expect(findWork(at(SWAP_VERIFIER.toLowerCase()), addresses, [8453])).toEqual([])
    expect(findWork({ '8453': { swapVerifier: bytecodeEntry() } }, addresses, [8453]).map((w) => w.kind)).toEqual(['unstamped'])
    expect(findWork({}, addresses, [8453]).map((w) => w.kind)).toEqual(['missing'])
    expect(staleEntries(at(OTHER), addresses)).toEqual([{ chainId: 8453, key: 'swapVerifier', address: SWAP_VERIFIER, proven: OTHER }])
  })

  it('check-completeness fails on it and names the command', async () => {
    const root = interfaces(files, {})
    write(join(root, 'verify', 'manifest.json'), { '8453': { swapVerifier: bytecodeEntry({ evidence: { address: OTHER } }) } })
    const check = execFileAsync(TSX, ['src/check-completeness.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses')], {
      cwd: ROOT,
      timeout: 60_000,
      env: { ...process.env, GITHUB_ACTIONS: '' },
    })
    await expect(check).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringMatching(/was proven at 0x0000000000000000000000000000000000000001; regenerate it[\s\S]*pnpm add-entries --interfaces .* --chain 8453/),
    })
  })
})

describe('case-sensitive filesystems', () => {
  it('finds the source whose import differs in letter case from the file name', async () => {
    const { unresolvedImporter } = await import('../src/compile.js')
    const output = [
      'forge build src --skip test --skip script failed:',
      'Error (6275): Source "src/Chainlink/DatastreamsVerifier.sol" not found: File not found. Searched the following locations: "/w/evk-periphery".',
      'ParserError: Source "src/Chainlink/DatastreamsVerifier.sol" not found: File not found.',
      ' --> src/HookTarget/HookTargetMarketStatus.sol:5:1:',
    ].join('\n')
    expect(unresolvedImporter(output)).toBe('src/HookTarget/HookTargetMarketStatus.sol')
    expect(unresolvedImporter('Error (2314): Expected \';\' but got identifier\n --> src/A.sol:3:1:')).toBeNull()
  })
})
