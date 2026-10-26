import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { formatManifest } from '../src/manifest-file.js'
import { explicitCandidates, githubSlug, manifestCandidates, parseCandidateArg } from '../src/candidates.js'
import { indexRowsOf, renderIndex, writeChainReports } from '../src/render-report.js'
import type { BytecodeEntry, CompileProfile, Manifest } from '../src/types.js'

const execFileAsync = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CANCUN: CompileProfile = { context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 20000, evm_version: 'cancun' }
const SHANGHAI: CompileProfile = { ...CANCUN, evm_version: 'shanghai' }
const sha = (c: string) => c.repeat(40)

function entry(commit: string, profile: CompileProfile = CANCUN, extra: Partial<BytecodeEntry> = {}): BytecodeEntry {
  return {
    repo: 'euler-xyz/evk-periphery',
    commit,
    contractName: 'SwapVerifier',
    profile,
    verified: 'bytecode',
    waiver: null,
    evidence: { codeSize: 1, origin: 'hint+native', strippedSha256: 'ab' },
    ...extra,
  }
}

describe('manifest formatting', () => {
  it('reproduces verify/manifest.json byte for byte', () => {
    const raw = readFileSync(join(ROOT, 'manifests', 'manifest.json'), 'utf8')
    expect(formatManifest(JSON.parse(raw))).toBe(raw)
  })

  it('orders chain ids as strings and escapes non-ASCII like Python json', () => {
    expect(formatManifest({ '56': {}, '130': { b: [], a: 'é—' }, '1': 1 })).toBe(
      '{\n "1": 1,\n "130": {\n  "a": "\\u00e9\\u2014",\n  "b": []\n },\n "56": {}\n}\n',
    )
  })
})

describe('candidates from the manifest', () => {
  const manifest: Manifest = {
    '1': { swapVerifier: entry(sha('a')), evc: entry(sha('e')) },
    '56': { swapVerifier: entry(sha('b')), evc: entry(sha('e')) },
    '130': { swapVerifier: entry(sha('b')) },
    '146': { swapVerifier: entry(sha('b'), CANCUN, { evidence: { submoduleOverrides: [{ path: 'lib/x', ref: 'v1' }] } }) },
    '239': { swapVerifier: entry(sha('c'), SHANGHAI) },
    '8453': { oracleRouterFactory: entry(sha('c'), SHANGHAI, { contractName: 'EulerRouterFactory' }) },
  }

  it('offers each distinct pin other chains use, most used first, with its declared submodule pins', () => {
    const c = manifestCandidates(manifest, 999, 'swapVerifier')
    expect(c.map((x) => [x.prove.commit[0], x.prove.profile === 'native' ? 'native' : x.prove.profile.evm_version, x.prove.submoduleOverrides?.length ?? 0])).toEqual([
      ['b', 'cancun', 0],
      ['a', 'cancun', 0],
      ['b', 'cancun', 1],
      ['c', 'shanghai', 0],
    ])
    expect(c[0]!.prove.origin).toBe('manifest:56')
    expect(c[0]!.profile).toEqual(CANCUN)
  })

  it('never offers the chain its own pins, and ranks pins the chain already uses for another key first', () => {
    const c = manifestCandidates(manifest, 8453, 'swapVerifier')
    expect(c[0]!.prove.commit).toBe(sha('c'))
    expect(manifestCandidates(manifest, 239, 'swapVerifier').some((x) => x.prove.commit === sha('c'))).toBe(false)
  })

  it('offers explicit commits only for keys their repo can hold, with native and the manifest profiles', () => {
    const offer = { repo: 'euler-xyz/evk-periphery', commit: sha('f'), profiles: ['native' as const], manifestProfiles: true, origin: 'candidate' }
    const c = explicitCandidates(manifest, 'swapVerifier', [offer, { ...offer, repo: 'euler-xyz/euler-earn' }])
    expect(c.map((x) => (x.prove.profile === 'native' ? 'native' : x.prove.profile.evm_version))).toEqual(['native', 'cancun', 'shanghai'])
    expect(c.every((x) => x.prove.repo === 'euler-xyz/evk-periphery' && x.prove.origin === 'candidate')).toBe(true)
    expect(c[0]!.profile).toBeUndefined()
  })

  it.each([
    ['governorAccessControlEmergencyFactoryV2', 'GovernorAccessControlEmergencyFactoryV2'],
    ['securitizeFactoryV2', 'ERC4626EVCCollateralSecuritizeFactoryV2'],
  ])('tries the build a deploy script makes for %s before the commit profiles', (key, contractName) => {
    const offer = { repo: 'euler-xyz/evk-periphery', commit: sha('f'), profiles: ['native' as const], manifestProfiles: true, origin: 'candidate' }
    const c = explicitCandidates({}, key, [offer])
    expect(c.map((x) => x.prove.profile)).toEqual([{ ...CANCUN, optimizer_runs: 10000 }, 'native'])
    expect(c[0]!.profile).toEqual({ ...CANCUN, optimizer_runs: 10000 })
    expect(c.every((x) => x.prove.contractName === contractName)).toBe(true)
  })

  it('tries a checkout that leaves solc unpinned with the solc versions the manifest knows', () => {
    const offer = {
      repo: 'euler-xyz/evk-periphery',
      commit: sha('f'),
      profiles: [],
      unpinnedSolc: { context: 'evk-periphery', optimizer_runs: 10000, evm_version: 'london' },
      origin: 'candidates-from:euler-xyz/evk-periphery@ffffffff',
    }
    const [first] = explicitCandidates(manifest, 'swapVerifier', [offer])
    expect(first!.prove.profile).toEqual({ context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 10000, evm_version: 'london' })
  })

  it('parses --candidate and GitHub remotes', () => {
    expect(parseCandidateArg(`evk-periphery@${sha('A')}`)).toEqual({ repo: 'euler-xyz/evk-periphery', commit: sha('a') })
    expect(parseCandidateArg(`other/repo@${sha('b')}`)).toEqual({ repo: 'other/repo', commit: sha('b') })
    expect(() => parseCandidateArg('evk-periphery@master')).toThrow(/40-hex/)
    expect(githubSlug('git@github.com:euler-xyz/evk-periphery.git')).toBe('euler-xyz/evk-periphery')
    expect(githubSlug('https://github.com/euler-xyz/euler-vault-kit')).toBe('euler-xyz/euler-vault-kit')
    expect(githubSlug('https://gitlab.com/x/y.git')).toBeNull()
  })
})

describe('per-chain render', () => {
  const row = (id: number, name: string, proven: string) => `| [${name}](${id}.md) | ${id} | ${proven} |`

  it('replaces only the rendered chains rows in README.md, in chain-id order', () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-index-'))
    try {
      writeFileSync(join(dir, 'README.md'), renderIndex(new Map([[1, row(1, 'One', '20/21')], [130, row(130, 'Uni', '21/21')]])))
      writeChainReports(dir, [{ chainId: 56, report: '# BSC\n', row: row(56, 'BSC', '21/21'), proven: 21, total: 21 }], false)
      const readme = readFileSync(join(dir, 'README.md'), 'utf8')
      expect([...indexRowsOf(readme).keys()]).toEqual([1, 56, 130])
      expect(readme).toBe(renderIndex(new Map([[1, row(1, 'One', '20/21')], [56, row(56, 'BSC', '21/21')], [130, row(130, 'Uni', '21/21')]])))
      expect(readFileSync(join(dir, '56.md'), 'utf8')).toBe('# BSC\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('check-completeness', () => {
  it('names the command that generates the missing entries', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-completeness-'))
    try {
      mkdirSync(join(dir, 'addresses', '8453'), { recursive: true })
      writeFileSync(join(dir, 'addresses', '8453', 'PeripheryAddresses.json'), JSON.stringify({ swapVerifier: '0x93A732A1900697d5f51C77fe09275486BB0bb83D' }))
      writeFileSync(join(dir, 'manifest.json'), '{}')
      const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
      const run = execFileAsync(tsx, ['src/check-completeness.ts', '--manifest', join(dir, 'manifest.json'), '--addresses', join(dir, 'addresses')], {
        cwd: ROOT,
        timeout: 60_000,
        env: { ...process.env, GITHUB_ACTIONS: '' },
      })
      await expect(run).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining(`pnpm add-entries --interfaces ${dir} --chain 8453`),
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('requires an entry for the V2 governor suite factory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-completeness-'))
    const factory = '0xece1042A1B06D994B90AB5D41F8c7898Ab96aeA0'
    try {
      mkdirSync(join(dir, 'addresses', '1'), { recursive: true })
      writeFileSync(join(dir, 'addresses', '1', 'PeripheryAddresses.json'), JSON.stringify({ governorAccessControlEmergencyFactoryV2: factory }))
      writeFileSync(join(dir, 'manifest.json'), '{}')
      const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
      const run = execFileAsync(tsx, ['src/check-completeness.ts', '--manifest', join(dir, 'manifest.json'), '--addresses', join(dir, 'addresses')], {
        cwd: ROOT,
        timeout: 60_000,
        env: { ...process.env, GITHUB_ACTIONS: '' },
      })
      await expect(run).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining(`1/governorAccessControlEmergencyFactoryV2 (${factory}): deployed but missing from manifest`),
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
