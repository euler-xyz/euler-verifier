import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { computeComponentDiffs, type ComponentBaseline } from '../src/run-baselines.js'

const execFileAsync = promisify(execFile)
const ID = ['-c', 'user.email=t@t', '-c', 'user.name=t']
const INNER = '7'.repeat(40)

async function git(cwd: string, ...args: string[]): Promise<string> {
  return (await execFileAsync('git', args, { cwd })).stdout.trim()
}

function write(file: string, body: string): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, body)
}

async function commit(dir: string, message: string): Promise<string> {
  await git(dir, 'add', 'src')
  await git(dir, ...ID, 'commit', '-qm', message)
  return git(dir, 'rev-parse', 'HEAD')
}

/**
 * A lib repo with v1 → v2 on master and a side branch off v1 that changes
 * only another file, and an app repo whose commits pin the lib by gitlink.
 */
async function fixture() {
  const reposDir = mkdtempSync(join(tmpdir(), 'verifier-libs-'))
  const lib = join(reposDir, 'dep')
  mkdirSync(lib)
  await git(lib, 'init', '-q', '-b', 'master')
  write(join(lib, 'src', 'Util.sol'), 'contract Util { uint256 a; }\n')
  await git(lib, 'update-index', '--add', '--cacheinfo', `160000,${INNER},lib/inner`)
  const v1 = await commit(lib, 'v1')
  write(join(lib, 'src', 'Util.sol'), 'contract Util { uint256 a; uint256 guard; }\n')
  const v2 = await commit(lib, 'v2')
  await git(lib, 'checkout', '-q', '-b', 'side', v1)
  write(join(lib, 'src', 'Set.sol'), 'contract Set {}\n')
  const side = await commit(lib, 'side')
  await git(lib, 'checkout', '-q', '-b', 'fork', v1)
  write(join(lib, 'src', 'Util.sol'), 'contract Util { uint256 a; uint256 other; }\n')
  const fork = await commit(lib, 'fork')
  await git(lib, 'checkout', '-q', 'master')
  await git(lib, 'remote', 'add', 'origin', 'https://github.com/euler-xyz/dep.git')

  const app = join(reposDir, 'app')
  mkdirSync(app)
  await git(app, 'init', '-q', '-b', 'master')
  write(join(app, 'src', 'App.sol'), 'contract App {}\n')
  const bare = await commit(app, 'app without the lib')
  await git(app, 'update-index', '--add', '--cacheinfo', `160000,${v1},lib/dep`)
  write(join(app, '.gitmodules'), '[submodule "lib/dep"]\n\tpath = lib/dep\n\turl = https://github.com/euler-xyz/dep.git\n')
  await git(app, 'add', '.gitmodules')
  write(join(app, 'src', 'App.sol'), 'contract App { uint256 a; }\n')
  const base = await commit(app, 'app base')
  write(join(app, 'src', 'App.sol'), 'contract App { uint256 b; }\n')
  const pin = await commit(app, 'app pin')
  await git(app, 'remote', 'add', 'origin', 'https://github.com/euler-xyz/app.git')

  const spec: ComponentBaseline = {
    component: 'app',
    repo: 'euler-xyz/app',
    keys: ['app'],
    componentPaths: ['src/'],
    lastAudit: { id: 'audit-app', date: '2026-01-01', finalReviewedCommit: base },
    baseline: { commit: base, date: '2026-01-01', derivation: 'd', confidence: 'high' },
    libComponents: [
      {
        repo: 'euler-xyz/dep',
        gitlinkPath: 'lib/dep',
        componentPaths: ['src/Util.sol'],
        lastAudit: { id: 'audit-dep', date: '2026-01-01', finalReviewedCommit: v2 },
        baseline: { commit: v2, date: '2026-01-01', derivation: 'lib d', confidence: 'high' },
      },
    ],
  }
  return { reposDir, out: mkdtempSync(join(tmpdir(), 'verifier-libs-out-')), v1, v2, side, fork, bare, base, pin, spec }
}

describe('embedded libs resolve to the code that was compiled', () => {
  it('takes the lib from a submodule override, not the pin gitlink', async () => {
    const f = await fixture()
    const manifest = {
      '1': { app: { repo: 'euler-xyz/app', commit: f.pin } },
      '2': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [{ path: 'lib/dep', ref: f.v2 }] } } },
    }
    const pairs = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    expect(pairs).toHaveLength(2)
    const plain = pairs.find((p) => p.chains.includes('1'))!
    const overridden = pairs.find((p) => p.chains.includes('2'))!
    expect(plain.libComponents[0]).toMatchObject({ ref: f.v1, pinGitlink: f.v1, refSource: 'gitlink', relation: 'predates-baseline', files: 1 })
    expect(overridden.libComponents[0]).toMatchObject({ ref: f.v2, pinGitlink: f.v1, refSource: 'override', files: 0 })
    expect(overridden.overrides).toEqual([{ path: 'lib/dep', ref: f.v2, gitlink: f.v1 }])
    expect(plain.diffFile === null || plain.diffFile !== overridden.diffFile).toBe(true)
    expect(plain.libComponents[0]!.diffFile).not.toBe(overridden.libComponents[0]!.diffFile)
  })

  it('treats a divergent ref whose lib files equal an older state as predating the baseline', async () => {
    const f = await fixture()
    const manifest = { '1': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [{ path: 'lib/dep', ref: f.side }] } } } }
    const [pair] = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    expect(pair!.libComponents[0]).toMatchObject({ ref: f.side, relation: 'predates-baseline', files: 1, insertions: 1, deletions: 1 })
  })

  it('keys lib diffs by content, so the same files under two refs share a key', async () => {
    const f = await fixture()
    const manifest = {
      '1': { app: { repo: 'euler-xyz/app', commit: f.pin } },
      '2': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [{ path: 'lib/dep', ref: f.side }] } } },
    }
    const pairs = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    const [a, b] = pairs.map((p) => p.libComponents[0]!)
    expect(a!.ref).not.toBe(b!.ref)
    expect(a!.contentKey).toBe(b!.contentKey)
  })

  it('compares the lib with the version the component baseline compiled', async () => {
    const f = await fixture()
    const manifest = {
      '1': { app: { repo: 'euler-xyz/app', commit: f.pin } },
      '2': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [{ path: 'lib/dep', ref: f.v2 }] } } },
    }
    const pairs = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    const plain = pairs.find((p) => p.chains.includes('1'))!.libComponents[0]!
    const overridden = pairs.find((p) => p.chains.includes('2'))!.libComponents[0]!
    expect(plain.vsComponentBaseline).toEqual({ ref: f.v1, files: 0, insertions: 0, deletions: 0 })
    expect(overridden.vsComponentBaseline).toEqual({ ref: f.v1, files: 1, insertions: 1, deletions: 1 })
  })

  it('keeps a ref that changed the lib files on a side branch divergent', async () => {
    const f = await fixture()
    const manifest = { '1': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [{ path: 'lib/dep', ref: f.fork }] } } } }
    const [pair] = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    expect(pair!.libComponents[0]).toMatchObject({ ref: f.fork, relation: 'divergent' })
  })

  it('has no component-baseline comparison when the baseline compiled no such lib', async () => {
    const f = await fixture()
    const spec = { ...f.spec, baseline: { ...f.spec.baseline, commit: f.bare } }
    const manifest = { '1': { app: { repo: 'euler-xyz/app', commit: f.pin } } }
    const [pair] = await computeComponentDiffs(manifest, [spec], f.reposDir, f.out, () => {})
    expect(pair!.libComponents[0]).toMatchObject({ ref: f.v1, vsComponentBaseline: null })
  })

  it('resolves the commit a nested submodule override replaces', async () => {
    const f = await fixture()
    const override = { path: 'lib/dep/lib/inner', ref: '8'.repeat(40) }
    const manifest = { '1': { app: { repo: 'euler-xyz/app', commit: f.pin, evidence: { submoduleOverrides: [override] } } } }
    const [pair] = await computeComponentDiffs(manifest, [f.spec], f.reposDir, f.out, () => {})
    expect(pair!.overrides).toEqual([{ ...override, gitlink: INNER }])
  })
})
