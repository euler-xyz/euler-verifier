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
import { addressChainIds, resolveAddress, staleRegistryChains } from '../src/addresses.js'
import { ensureRepoCheckout } from '../src/compile.js'
import { interfacesPaths, renderChains } from '../src/chain-render.js'
import { findWork, staleEntries } from '../src/manifest-work.js'
import { revertEntries } from '../src/add-entries.js'
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
    const { problems } = await renderChains([1], true, run(root, manifest))
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
    const { problems } = await renderChains([1], false, run(root, manifest))
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
    const { problems } = await renderChains([8453], false, run(root, manifest))
    expect(problems).toEqual(['8453: EVault modules not verified (rpc: all RPC endpoints failed)'])
    expect(existsSync(join(root, 'verify', '8453.md'))).toBe(false)
  })

  it('a build error in EulerSwap management verification stops the chain and writes nothing', async () => {
    vi.mocked(proveTask).mockResolvedValue(proven)
    vi.mocked(verifyManifestModules).mockResolvedValue({ results: {}, ok: true })
    vi.mocked(verifyManifestSwapManagement).mockResolvedValue({ results: { '8453': { error: 'forge build src failed' } }, ok: false })
    const root = interfaces({ 'addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }, manifest)
    const { problems } = await renderChains([8453], false, run(root, manifest))
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

  it('validate-manifests accepts an audit entry with no sign-off field', async () => {
    const root = interfaces({}, {})
    const audit = { id: 'a', repo: 'euler-xyz/evc', firm: 'X', date: '2024-01-01', commits: { reviewed: SHA('a'), final: SHA('b') }, scope: [], report: '', confidence: 'high' }
    write(join(root, 'audits.json'), [audit])
    const validate = execFileAsync(TSX, ['src/validate-manifests.ts', '--audits', join(root, 'audits.json')], { cwd: ROOT, timeout: 60_000 })
    await expect(validate).resolves.toMatchObject({ stdout: expect.stringContaining('manifests valid') })
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

describe('a submodule override cannot move the commit being verified', () => {
  async function git(cwd: string, ...args: string[]) {
    return (await execFileAsync('git', ['-c', 'protocol.file.allow=always', '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd })).stdout.trim()
  }

  /** An engine clone at commit A with submodule lib/dep, a later root commit B, and a second dep commit. */
  async function cloneWithSubmodule() {
    const dep = tempDir('verifier-dep-')
    await git(dep, 'init', '-q')
    write(join(dep, 'Dep.sol'), 'contract Dep {}\n')
    await git(dep, 'add', '.')
    await git(dep, 'commit', '-qm', 'dep 1')
    write(join(dep, 'Dep.sol'), 'contract Dep { uint256 x; }\n')
    await git(dep, 'commit', '-qam', 'dep 2')
    const depCommit = await git(dep, 'rev-parse', 'HEAD')
    await git(dep, 'checkout', '-q', 'HEAD~1')

    const upstream = tempDir('verifier-upstream-')
    await git(upstream, 'init', '-q')
    write(join(upstream, 'src', 'A.sol'), 'contract A {}\n')
    await git(upstream, 'submodule', 'add', '-q', dep, 'lib/dep')
    await git(upstream, 'add', '.')
    await git(upstream, 'commit', '-qm', 'a')
    const commitA = await git(upstream, 'rev-parse', 'HEAD')
    write(join(upstream, 'src', 'B.sol'), 'contract B {}\n')
    await git(upstream, 'add', '.')
    await git(upstream, 'commit', '-qm', 'b')
    const commitB = await git(upstream, 'rev-parse', 'HEAD')

    const reposDir = tempDir('verifier-repos-')
    const dir = join(reposDir, 'repo')
    await git(reposDir, 'clone', '-q', upstream, dir)
    await git(dir, 'remote', 'set-url', 'origin', 'https://github.com/euler-xyz/repo.git')
    return { reposDir, dir, commitA, commitB, depCommit }
  }

  beforeEach(() => {
    vi.stubEnv('GIT_CONFIG_COUNT', '1')
    vi.stubEnv('GIT_CONFIG_KEY_0', 'protocol.file.allow')
    vi.stubEnv('GIT_CONFIG_VALUE_0', 'always')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('refuses the repository root and plain directories as override paths', async () => {
    const { reposDir, dir, commitA, commitB } = await cloneWithSubmodule()
    for (const path of ['.', 'src', 'lib/../.']) {
      const checkout = ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: commitA, reposDir, submoduleOverrides: [{ path, ref: commitB }] })
      await expect(checkout).rejects.toThrow(`submodule override path ${path} is not an initialized submodule of this checkout`)
      expect(await git(dir, 'rev-parse', 'HEAD')).toBe(commitA)
      expect(existsSync(join(dir, 'src', 'B.sol'))).toBe(false)
    }
  })

  it('moves a real submodule and keeps the root at its pin', async () => {
    const { reposDir, dir, commitA, depCommit } = await cloneWithSubmodule()
    await ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: commitA, reposDir, submoduleOverrides: [{ path: 'lib/dep', ref: depCommit }] })
    expect(await git(dir, 'rev-parse', 'HEAD')).toBe(commitA)
    expect(await git(join(dir, 'lib', 'dep'), 'rev-parse', 'HEAD')).toBe(depCommit)
  })

  /** root -> "lib/my mid" (two commits, both recording inner@I1) -> lib/inner (I1, I2). */
  async function nestedClone() {
    const commitIn = async (repo: string, file: string, body: string) => {
      write(join(repo, file), body)
      await git(repo, 'add', '.')
      await git(repo, 'commit', '-qm', file)
      return git(repo, 'rev-parse', 'HEAD')
    }
    const inner = tempDir('verifier-inner-')
    await git(inner, 'init', '-q')
    const i1 = await commitIn(inner, 'Inner.sol', 'contract Inner {}\n')
    const i2 = await commitIn(inner, 'Inner.sol', 'contract Inner { uint256 x; }\n')
    await git(inner, 'checkout', '-q', i1)
    const mid = tempDir('verifier-mid-')
    await git(mid, 'init', '-q')
    await git(mid, 'submodule', 'add', '-q', inner, 'lib/inner')
    await commitIn(mid, 'Mid.sol', 'contract Mid {}\n')
    const m2 = await commitIn(mid, 'Mid.sol', 'contract Mid { uint256 y; }\n')
    const upstream = tempDir('verifier-upstream-')
    await git(upstream, 'init', '-q')
    await git(upstream, 'submodule', 'add', '-q', mid, 'lib/my mid')
    const root = await commitIn(upstream, 'src/A.sol', 'contract A {}\n')
    const reposDir = tempDir('verifier-repos-')
    const dir = join(reposDir, 'repo')
    await git(reposDir, 'clone', '-q', upstream, dir)
    await git(dir, 'remote', 'set-url', 'origin', 'https://github.com/euler-xyz/repo.git')
    return { reposDir, dir, root, m2, i1, i2 }
  }

  it('fails when a later parent override undoes a nested one', async () => {
    const { reposDir, root, m2, i2 } = await nestedClone()
    const submoduleOverrides = [
      { path: 'lib/my mid/lib/inner', ref: i2 },
      { path: 'lib/my mid', ref: m2 },
    ]
    await expect(ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: root, reposDir, submoduleOverrides })).rejects.toThrow(
      `submodule override lib/my mid/lib/inner is at`,
    )
    await ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: root, reposDir, submoduleOverrides: [...submoduleOverrides].reverse() })
  })

  it('drops a nested submodule an earlier build left off its gitlink', async () => {
    const { reposDir, dir, root, i2 } = await nestedClone()
    await ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: root, reposDir })
    await git(join(dir, 'lib', 'my mid', 'lib', 'inner'), 'checkout', '-q', i2)
    await ensureRepoCheckout({ repo: 'euler-xyz/repo', commit: root, reposDir, recursiveSubmodules: false })
    expect(existsSync(join(dir, 'lib', 'my mid', 'lib', 'inner', 'Inner.sol'))).toBe(false)
    expect(existsSync(join(dir, 'lib', 'my mid', 'Mid.sol'))).toBe(true)
  })

  it('validate-manifests rejects an override path outside the submodules', async () => {
    const root = interfaces({}, {})
    const evidence = { submoduleOverrides: [{ path: '.', ref: SHA('b') }] }
    write(join(root, 'manifest.json'), { '8453': { swapVerifier: bytecodeEntry({ evidence }) } })
    const validate = execFileAsync(TSX, ['src/validate-manifests.ts', '--manifest', join(root, 'manifest.json')], { cwd: ROOT, timeout: 60_000 })
    await expect(validate).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('submodule override path "." is not a repo-relative submodule path') })
  })

  it('validate-manifests rejects a repeated override and a parent listed after a submodule inside it', async () => {
    const root = interfaces({}, {})
    const overrides = (...paths: string[]) => ({ evidence: { submoduleOverrides: paths.map((path) => ({ path, ref: SHA('b') })) } })
    write(join(root, 'manifest.json'), {
      '1': { swapVerifier: bytecodeEntry(overrides('lib/a', 'lib/a')) },
      '8453': { swapVerifier: bytecodeEntry(overrides('lib/a/lib/b', 'lib/a')) },
      '130': { swapVerifier: bytecodeEntry(overrides('lib/a', 'lib/a/lib/b', 'lib/c')) },
    })
    const { code, stderr } = await execFileAsync(TSX, ['src/validate-manifests.ts', '--manifest', join(root, 'manifest.json')], {
      cwd: ROOT,
      timeout: 60_000,
    }).then(
      () => ({ code: 0, stderr: '' }),
      (err: { code: number; stderr: string }) => err,
    )
    expect(code).toBe(1)
    expect(stderr).toMatch(/1\/swapVerifier: submodule override lib\/a is listed twice/)
    expect(stderr).toMatch(/8453\/swapVerifier: submodule override lib\/a comes after lib\/a\/lib\/b inside it/)
    expect(stderr).not.toMatch(/130\/swapVerifier/)
  })
})

describe('an address key has one published address across groups', () => {
  const conflicting = {
    'addresses/1/TokenAddresses.json': { EUL: OTHER },
    'addresses/1/BridgeAddresses.json': { EUL },
  }

  it('rejects different addresses for one key in two groups, and accepts the same one', () => {
    const root = interfaces(conflicting, {})
    expect(() => resolveAddress(join(root, 'addresses'), 1, 'EUL')).toThrow(/1\/EUL has different addresses in BridgeAddresses.json .* TokenAddresses.json/)
    const agreeing = interfaces({ ...conflicting, 'addresses/1/TokenAddresses.json': { EUL: EUL.toLowerCase() } }, {})
    expect(resolveAddress(join(agreeing, 'addresses'), 1, 'EUL')).toBe(EUL)
  })

  it('rejects a zero address in one group and an address in another', () => {
    const zero = '0x0000000000000000000000000000000000000000'
    const root = interfaces({ ...conflicting, 'addresses/1/TokenAddresses.json': { EUL: zero } }, {})
    expect(() => resolveAddress(join(root, 'addresses'), 1, 'EUL')).toThrow(/1\/EUL has different addresses/)
    const unset = interfaces({ 'addresses/1/TokenAddresses.json': { EUL: zero } }, {})
    expect(resolveAddress(join(unset, 'addresses'), 1, 'EUL')).toBeNull()
  })

  it('the verify CLI fails the entry instead of verifying one of them', async () => {
    const manifest = { '1': { EUL: { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'n' } } }
    const root = interfaces(conflicting, manifest as unknown as Manifest)
    const cli = execFileAsync(TSX, ['src/cli.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses'), '--chain', '1', '--no-explorer'], {
      cwd: ROOT,
      timeout: 60_000,
    })
    await expect(cli).rejects.toMatchObject({ code: 1, stdout: expect.stringMatching(/ERROR\s+chain=1 EUL 1\/EUL has different addresses/) })
  })

  it('check-completeness lists the conflict', async () => {
    const root = interfaces(conflicting, {})
    const check = execFileAsync(TSX, ['src/check-completeness.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses')], {
      cwd: ROOT,
      timeout: 60_000,
    })
    await expect(check).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('1/EUL has different addresses') })
  })
})

describe('a chain published only from config/addresses is covered', () => {
  const files = { 'config/addresses/8453/PeripheryAddresses.json': { swapVerifier: SWAP_VERIFIER } }

  it('is listed and its contracts are found', () => {
    const root = interfaces({ ...files, 'addresses/1/TokenAddresses.json': { EUL } }, {})
    expect(addressChainIds(join(root, 'addresses'))).toEqual([1, 8453])
    expect(findWork({}, join(root, 'addresses'), [8453]).map((w) => [w.kind, w.key])).toEqual([['missing', 'swapVerifier']])
  })

  it('check-completeness reports its missing entries', async () => {
    const root = interfaces(files, {})
    const check = execFileAsync(TSX, ['src/check-completeness.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses')], {
      cwd: ROOT,
      timeout: 60_000,
    })
    await expect(check).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining(`8453/swapVerifier (${SWAP_VERIFIER}): deployed but missing from manifest`) })
  })

  it('check-completeness reports manifest entries for a chain without address files', async () => {
    const root = interfaces({}, { '8453': { swapVerifier: bytecodeEntry() } })
    const check = execFileAsync(TSX, ['src/check-completeness.ts', '--manifest', join(root, 'verify', 'manifest.json'), '--addresses', join(root, 'addresses')], {
      cwd: ROOT,
      timeout: 60_000,
    })
    await expect(check).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('8453: manifest entries for a chain without address files') })
  })
})

describe('add-entries writes an entry only with its chain report', () => {
  it('reverts entries whose chain did not render, keeping the rest', () => {
    const original: Manifest = { '1': { EUL: bytecodeEntry({ commit: SHA('1') }) } }
    const next: Manifest = {
      '1': { EUL: bytecodeEntry({ commit: SHA('2') }), swapVerifier: bytecodeEntry() },
      '8453': { swapVerifier: bytecodeEntry() },
      '130': { swapVerifier: bytecodeEntry() },
    }
    const reverted = revertEntries(next, original, [
      { chainId: 1, key: 'EUL', address: EUL },
      { chainId: 1, key: 'swapVerifier', address: SWAP_VERIFIER },
      { chainId: 8453, key: 'swapVerifier', address: SWAP_VERIFIER },
    ])
    expect(reverted).toEqual({ '1': original['1'], '130': next['130'] })
  })
})
