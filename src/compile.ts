import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fromHex } from './metadata.js'
import type { CompileProfile, ImmutableRange } from './types.js'

const execFileAsync = promisify(execFile)

const COMMIT_RE = /^[0-9a-f]{40}$/

export interface EffectiveProfile {
  solc: string
  optimizer_runs: number
  evm_version: string
}

export interface BuildResult {
  code: Uint8Array
  immutableReferences: Record<string, ImmutableRange[]>
  artifactPath: string
  repoDir: string
  /** Settings the compiler actually used, parsed from the artifact metadata. */
  effectiveProfile?: EffectiveProfile
  /** Source file paths of the compilation unit (repo-relative), for audit-frontier scoping. */
  sources: string[]
}

export interface BuildRequest {
  /** GitHub slug, e.g. "euler-xyz/ethereum-vault-connector". */
  repo: string
  /** Full 40-hex commit SHA (branch/tag pins are rejected by design). */
  commit: string
  contractName: string
  /**
   * Explicit compile settings, or 'native' to build with the repo's own
   * foundry.toml at that commit (effective settings are read back from the
   * artifact either way).
   */
  profile: CompileProfile | 'native'
  /** Directory under which engine-managed clones live. */
  reposDir: string
  /** Initialize submodules recursively (needed for repos with nested deps). */
  recursiveSubmodules?: boolean
  /**
   * Nested submodule refs to force after checkout (deployments sometimes ran
   * with manually-updated submodules that no commit's gitlinks record).
   * Paths are repo-relative, refs are commits/tags in that submodule.
   */
  submoduleOverrides?: Array<{ path: string; ref: string }>
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
export async function ensureRepoCheckout(req: Pick<BuildRequest, 'repo' | 'commit' | 'reposDir' | 'recursiveSubmodules' | 'submoduleOverrides'>): Promise<string> {
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
  // Recursive by default: builds (unlike text comparison) need the full
  // dependency tree — nested lib sources are compiled, not just read.
  if (req.recursiveSubmodules !== false) {
    try {
      await run('git', ['submodule', 'update', '--quiet', '--init', '--force', '--jobs', '8', '--recursive'], {
        cwd: dir,
        timeoutMs: 2_400_000,
      })
    } catch {
      // Old pins sometimes reference nested gitlinks that upstreams have
      // force-pushed away (submodule rot). Fall back to best-effort:
      // top-level init strictly, then each submodule's own tree tolerantly.
      // A genuinely required missing source still fails at forge build —
      // this can only produce build failures, never false matches.
      await run('git', ['submodule', 'update', '--quiet', '--init', '--force', '--jobs', '8'], {
        cwd: dir,
        timeoutMs: 1_200_000,
      })
      await run(
        'git',
        ['submodule', 'foreach', '--quiet', 'git submodule update --quiet --init --force --recursive --jobs 4 || true'],
        { cwd: dir, timeoutMs: 2_400_000 },
      )
    }
  } else {
    await run('git', ['submodule', 'update', '--quiet', '--init', '--force', '--jobs', '8'], {
      cwd: dir,
      timeoutMs: 1_200_000,
    })
  }

  for (const o of req.submoduleOverrides ?? []) {
    const subDir = join(dir, o.path)
    if (!existsSync(subDir)) throw new Error(`submodule override path missing: ${o.path}`)
    const have = await run('git', ['cat-file', '-t', `${o.ref}^{commit}`], { cwd: subDir }).then(
      (t) => t.trim() === 'commit',
      () => false,
    )
    if (!have) {
      await run('git', ['fetch', '--quiet', '--tags', 'origin'], { cwd: subDir, timeoutMs: 600_000 }).catch(() => {})
      await run('git', ['fetch', '--quiet', 'origin', o.ref], { cwd: subDir, timeoutMs: 600_000 }).catch(() => {})
    }
    await run('git', ['checkout', '--quiet', '--force', o.ref], { cwd: subDir })
    // The override's own dependency tree must follow it.
    await run('git', ['submodule', 'update', '--quiet', '--init', '--force', '--recursive', '--jobs', '4'], {
      cwd: subDir,
      timeoutMs: 1_200_000,
    }).catch(() => {})
  }

  return dir
}

function profileEnv(profile: CompileProfile | 'native'): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {
    ...process.env,
    // Deterministic output location regardless of repo-local profiles.
    FOUNDRY_OUT: 'out',
    FOUNDRY_PROFILE: 'default',
  }
  if (profile === 'native') return base
  return {
    ...base,
    // FOUNDRY_SOLC_VERSION only: the FOUNDRY_SOLC alias collides with
    // repos carrying an [etherscan] config table (foundry maps it onto
    // etherscan.solc and fails config parsing).
    FOUNDRY_SOLC_VERSION: profile.solc,
    FOUNDRY_OPTIMIZER: 'true',
    FOUNDRY_OPTIMIZER_RUNS: String(profile.optimizer_runs),
    FOUNDRY_EVM_VERSION: profile.evm_version,
  }
}

/**
 * Disable lint-on-build in the checkout's foundry.toml: newer forge runs a
 * lint pass whose import resolution rejects lib-internal import styles and
 * fails the build outright. The edit is transient — the next
 * `git checkout --force` reverts it.
 */
function disableLintOnBuild(repoDir: string): void {
  const tomlPath = join(repoDir, 'foundry.toml')
  if (!existsSync(tomlPath)) return
  let toml = readFileSync(tomlPath, 'utf8')
  if (/^\s*lint_on_build\s*=/m.test(toml)) {
    toml = toml.replace(/^\s*lint_on_build\s*=.*$/m, 'lint_on_build = false')
  } else if (/^\[lint\]\s*$/m.test(toml)) {
    toml = toml.replace(/^\[lint\]\s*$/m, '[lint]\nlint_on_build = false')
  } else {
    toml += '\n[lint]\nlint_on_build = false\n'
  }
  // forge ≥1.5 maps the FOUNDRY_SOLC_VERSION profile override onto any
  // [etherscan] config table as `etherscan.<key>.solc` and then fails config
  // parsing ("expected struct EtherscanConfig"). Explorer config is never
  // needed for builds, so strip the table transiently (reverted with the
  // lint patch by the checkout --force). Line-based: drop from an [etherscan*]
  // header up to (not including) the next section header.
  const lines = toml.split('\n')
  const kept: string[] = []
  let inEtherscan = false
  for (const line of lines) {
    if (/^\s*\[/.test(line)) inEtherscan = /^\s*\[etherscan/.test(line)
    if (!inEtherscan) kept.push(line)
  }
  writeFileSync(tomlPath, kept.join('\n'))
}

interface ArtifactMetadata {
  compiler?: { version?: string }
  settings?: { optimizer?: { runs?: number }; evmVersion?: string }
  sources?: Record<string, unknown>
}

function parseArtifactMetadata(raw: unknown): { effective?: EffectiveProfile; sources: string[] } {
  // forge emits `metadata` as an object (and `rawMetadata` as a string); accept both.
  let meta: ArtifactMetadata
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      meta = JSON.parse(raw) as ArtifactMetadata
    } catch {
      return { sources: [] }
    }
  } else if (raw && typeof raw === 'object') {
    meta = raw as ArtifactMetadata
  } else {
    return { sources: [] }
  }

  const version = meta.compiler?.version?.split('+')[0]
  const runs = meta.settings?.optimizer?.runs
  const evm = meta.settings?.evmVersion
  return {
    effective:
      version && runs !== undefined && evm ? { solc: version, optimizer_runs: runs, evm_version: evm } : undefined,
    sources: Object.keys(meta.sources ?? {}),
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

/**
 * Different contracts from the same (repo, commit, profile) share one forge
 * build: track what each repo checkout currently holds and reuse `out/`
 * instead of rebuilding per contract.
 */
const currentBuildSignature = new Map<string, string>()

function buildSignature(req: BuildRequest): string {
  const p =
    req.profile === 'native' ? 'native' : `${req.profile.solc}|${req.profile.optimizer_runs}|${req.profile.evm_version}`
  const ov = (req.submoduleOverrides ?? []).map((o) => `${o.path}@${o.ref}`).join(',')
  return `${req.repo}|${req.commit}|${p}|${ov}`
}

/** Checkout `repo@commit`, build with the manifest profile, return the deployed-bytecode artifact. */
export async function buildAtCommit(req: BuildRequest): Promise<BuildResult> {
  const signature = buildSignature(req)
  const dirKey = join(req.reposDir, basename(req.repo))

  if (currentBuildSignature.get(dirKey) !== signature) {
    currentBuildSignature.delete(dirKey)
    const repoDir = await ensureRepoCheckout(req)
    disableLintOnBuild(repoDir)

    // Stale artifacts from a previous profile would poison the comparison.
    rmSync(join(repoDir, 'out'), { recursive: true, force: true })
    rmSync(join(repoDir, 'cache'), { recursive: true, force: true })

    // Build only src/ and its transitive imports: repo and library test/script
    // trees are irrelevant to deployed bytecode and dominate compile time.
    await run('forge', ['build', 'src', '--skip', 'test', '--skip', 'script'], {
      cwd: repoDir,
      env: profileEnv(req.profile),
      timeoutMs: 900_000,
    })
    currentBuildSignature.set(dirKey, signature)
  }
  const repoDir = dirKey

  const fileName = `${req.contractName}.json`
  const candidates = findArtifacts(join(repoDir, 'out'), fileName)
  if (candidates.length === 0) {
    throw new Error(`no artifact ${fileName} under ${join(repoDir, 'out')} — wrong contractName or build produced nothing`)
  }
  const preferred = candidates.find((p) => p.includes(`${req.contractName}.sol`)) ?? candidates[0]!

  const artifact = JSON.parse(readFileSync(preferred, 'utf8')) as {
    deployedBytecode?: { object?: string; immutableReferences?: Record<string, ImmutableRange[]> }
    metadata?: unknown
  }
  const object = artifact.deployedBytecode?.object
  if (!object || object === '0x') {
    throw new Error(`artifact ${preferred} has no deployedBytecode.object`)
  }

  const { effective, sources } = parseArtifactMetadata(artifact.metadata)

  return {
    code: fromHex(object),
    immutableReferences: artifact.deployedBytecode?.immutableReferences ?? {},
    artifactPath: preferred,
    repoDir,
    effectiveProfile: effective,
    sources,
  }
}
