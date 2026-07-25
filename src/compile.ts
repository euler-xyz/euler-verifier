import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, rmSync, readFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fromHex } from './metadata.js'
import type { CompileProfile, ImmutableRange } from './types.js'

const execFileAsync = promisify(execFile)

const COMMIT_RE = /^[0-9a-f]{40}$/

export interface BuildResult {
  code: Uint8Array
  immutableReferences: Record<string, ImmutableRange[]>
  artifactPath: string
  repoDir: string
}

export interface BuildRequest {
  /** GitHub slug, e.g. "euler-xyz/ethereum-vault-connector". */
  repo: string
  /** Full 40-hex commit SHA (branch/tag pins are rejected by design). */
  commit: string
  contractName: string
  profile: CompileProfile
  /** Directory under which engine-managed clones live. */
  reposDir: string
  /** Initialize submodules recursively (needed for repos with nested deps). */
  recursiveSubmodules?: boolean
}

async function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<string> {
  try {
    const { stdout } = await execFileAsync(cmd, args, {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      timeout: opts.timeoutMs ?? 300_000,
      maxBuffer: 64 * 1024 * 1024,
    })
    return stdout
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string }
    const detail = (e.stderr || e.stdout || e.message || String(err)).trim().split('\n').slice(-15).join('\n')
    throw new Error(`${cmd} ${args.join(' ')} failed:\n${detail}`)
  }
}

/**
 * Clone (or reuse) an engine-managed checkout and pin it to the exact commit.
 * Engine clones live under `<reposDir>/` and are separate from any legacy
 * working copies. NOTE: checkouts mutate repo state — callers must not verify
 * two contracts from the same repo concurrently.
 */
export async function ensureRepoCheckout(req: Pick<BuildRequest, 'repo' | 'commit' | 'reposDir' | 'recursiveSubmodules'>): Promise<string> {
  if (!COMMIT_RE.test(req.commit)) {
    throw new Error(`manifest pin "${req.commit}" is not a full 40-hex commit SHA — branch and tag pins are rejected by design`)
  }

  mkdirSync(req.reposDir, { recursive: true })
  const dir = join(req.reposDir, basename(req.repo))

  if (!existsSync(join(dir, '.git'))) {
    await run('git', ['clone', '--quiet', `https://github.com/${req.repo}.git`, dir], { timeoutMs: 600_000 })
  }

  const present = await run('git', ['cat-file', '-t', `${req.commit}^{commit}`], { cwd: dir }).then(
    (t) => t.trim() === 'commit',
    () => false,
  )
  if (!present) {
    await run('git', ['fetch', '--quiet', 'origin', req.commit], { cwd: dir, timeoutMs: 600_000 }).catch(async () => {
      await run('git', ['fetch', '--quiet', '--tags', 'origin'], { cwd: dir, timeoutMs: 600_000 })
    })
  }

  await run('git', ['checkout', '--quiet', '--force', req.commit], { cwd: dir })
  await run('git', ['submodule', 'sync', '--quiet', '--recursive'], { cwd: dir })
  const submoduleArgs = ['submodule', 'update', '--quiet', '--init', '--force']
  if (req.recursiveSubmodules) submoduleArgs.push('--recursive')
  await run('git', submoduleArgs, { cwd: dir, timeoutMs: 900_000 })

  return dir
}

function profileEnv(profile: CompileProfile): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // Foundry maps FOUNDRY_<KEY> onto config keys; set both solc aliases.
    FOUNDRY_SOLC: profile.solc,
    FOUNDRY_SOLC_VERSION: profile.solc,
    FOUNDRY_OPTIMIZER: 'true',
    FOUNDRY_OPTIMIZER_RUNS: String(profile.optimizer_runs),
    FOUNDRY_EVM_VERSION: profile.evm_version,
    // Deterministic output location regardless of repo-local profiles.
    FOUNDRY_OUT: 'out',
    FOUNDRY_PROFILE: 'default',
  }
}

function findArtifacts(outDir: string, fileName: string): string[] {
  const hits: string[] = []
  if (!existsSync(outDir)) return hits
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry)
      if (statSync(p).isDirectory()) walk(p)
      else if (entry === fileName) hits.push(p)
    }
  }
  walk(outDir)
  return hits.sort()
}

/** Checkout `repo@commit`, build with the manifest profile, return the deployed-bytecode artifact. */
export async function buildAtCommit(req: BuildRequest): Promise<BuildResult> {
  const repoDir = await ensureRepoCheckout(req)

  // Stale artifacts from a previous profile would poison the comparison.
  rmSync(join(repoDir, 'out'), { recursive: true, force: true })
  rmSync(join(repoDir, 'cache'), { recursive: true, force: true })

  await run('forge', ['build', '--skip', 'test', '--skip', 'script'], {
    cwd: repoDir,
    env: profileEnv(req.profile),
    timeoutMs: 900_000,
  })

  const fileName = `${req.contractName}.json`
  const candidates = findArtifacts(join(repoDir, 'out'), fileName)
  if (candidates.length === 0) {
    throw new Error(`no artifact ${fileName} under ${join(repoDir, 'out')} — wrong contractName or build produced nothing`)
  }
  const preferred = candidates.find((p) => p.includes(`${req.contractName}.sol`)) ?? candidates[0]!

  const artifact = JSON.parse(readFileSync(preferred, 'utf8')) as {
    deployedBytecode?: { object?: string; immutableReferences?: Record<string, ImmutableRange[]> }
  }
  const object = artifact.deployedBytecode?.object
  if (!object || object === '0x') {
    throw new Error(`artifact ${preferred} has no deployedBytecode.object`)
  }

  return {
    code: fromHex(object),
    immutableReferences: artifact.deployedBytecode?.immutableReferences ?? {},
    artifactPath: preferred,
    repoDir,
  }
}
