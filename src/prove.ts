import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildAtCommit, type BuildRequest, type EffectiveProfile } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, resolveRpcUrls } from './rpc.js'
import { fromHex, toHex } from './metadata.js'
import type { CompileProfile, ImmutableRange, NetworkInfo } from './types.js'

export interface ProveCandidate {
  repo: string
  commit: string
  contractName: string
  profile: CompileProfile | 'native'
  recursiveSubmodules?: boolean
  /** Nested submodule refs forced after checkout (deploy-time drift from gitlinks). */
  submoduleOverrides?: Array<{ path: string; ref: string }>
  /** Where this candidate came from (hint/explorer/era/native) — recorded as provenance evidence. */
  origin: string
}

export interface ProveTask {
  chainId: number
  key: string
  address: string
  candidates: ProveCandidate[]
}

export interface CachedBuild {
  codeHex: string
  immutableReferences: Record<string, ImmutableRange[]>
  effectiveProfile?: EffectiveProfile
  sources: string[]
  artifactPath: string
  error?: string
}

export interface ProveOutcome {
  chainId: number
  key: string
  address: string
  status: 'PROVEN' | 'UNPROVEN' | 'RPC_ERROR'
  matched?: ProveCandidate & { effectiveProfile?: EffectiveProfile; sources: string[] }
  strippedSha256?: string
  chainCodeSize?: number
  attempts: Array<{ candidate: string; origin: string; result: string }>
  error?: string
}

function candidateKey(c: Pick<ProveCandidate, 'repo' | 'commit' | 'contractName' | 'profile' | 'submoduleOverrides'>): string {
  const p = c.profile === 'native' ? 'native' : `${c.profile.solc}|${c.profile.optimizer_runs}|${c.profile.evm_version}`
  const ov = (c.submoduleOverrides ?? []).map((o) => `${o.path}@${o.ref}`).join(',')
  return createHash('sha1').update(`${c.repo}|${c.commit}|${c.contractName}|${p}|${ov}`).digest('hex')
}

/**
 * Build-once cache across the whole sweep: distinct (repo, commit, contract,
 * profile) combinations build a single time; every chain then compares
 * against the cached bytes. Failed builds are cached too (negative cache) so
 * a bad candidate is not rebuilt per chain.
 */
export class BuildCache {
  private mem = new Map<string, CachedBuild>()
  constructor(
    private cacheDir: string,
    private reposDir: string,
  ) {
    mkdirSync(cacheDir, { recursive: true })
  }

  async get(c: ProveCandidate): Promise<CachedBuild> {
    const key = candidateKey(c)
    const hit = this.mem.get(key)
    if (hit) return hit

    const file = join(this.cacheDir, `${key}.json`)
    if (existsSync(file)) {
      const cached = JSON.parse(readFileSync(file, 'utf8')) as CachedBuild
      this.mem.set(key, cached)
      return cached
    }

    let result: CachedBuild
    try {
      const req: BuildRequest = {
        repo: c.repo,
        commit: c.commit,
        contractName: c.contractName,
        profile: c.profile,
        reposDir: this.reposDir,
        recursiveSubmodules: c.recursiveSubmodules,
        submoduleOverrides: c.submoduleOverrides,
      }
      const built = await buildAtCommit(req)
      result = {
        codeHex: toHex(built.code),
        immutableReferences: built.immutableReferences,
        effectiveProfile: built.effectiveProfile,
        sources: built.sources,
        artifactPath: built.artifactPath,
      }
    } catch (err) {
      result = {
        codeHex: '',
        immutableReferences: {},
        sources: [],
        artifactPath: '',
        error: err instanceof Error ? err.message.slice(0, 2000) : String(err),
      }
    }

    writeFileSync(file, JSON.stringify(result))
    this.mem.set(key, result)
    return result
  }
}

export interface ProveRunnerOptions {
  reposDir: string
  cacheDir: string
  networks: Map<number, NetworkInfo>
  log?: (line: string) => void
}

export async function proveTask(task: ProveTask, cache: BuildCache, opts: ProveRunnerOptions): Promise<ProveOutcome> {
  const log = opts.log ?? (() => {})
  const attempts: ProveOutcome['attempts'] = []

  let chainCode: Uint8Array
  try {
    const urls = resolveRpcUrls(task.chainId, opts.networks.get(task.chainId))
    chainCode = (await fetchDeployedCode(task.chainId, task.address, urls)).code
  } catch (err) {
    return {
      chainId: task.chainId,
      key: task.key,
      address: task.address,
      status: 'RPC_ERROR',
      attempts,
      error: err instanceof Error ? err.message.slice(0, 500) : String(err),
    }
  }

  for (const c of task.candidates) {
    const ovLabel = c.submoduleOverrides?.length ? ` +${c.submoduleOverrides.map((o) => `${o.path.split('/').pop()}@${o.ref.slice(0, 8)}`).join('+')}` : ''
    const label = `${c.repo}@${c.commit.slice(0, 8)} ${c.contractName} [${c.profile === 'native' ? 'native' : `${c.profile.solc}/${c.profile.optimizer_runs}/${c.profile.evm_version}`}]${ovLabel}`
    const build = await cache.get(c)
    if (build.error) {
      attempts.push({ candidate: label, origin: c.origin, result: `build-error: ${build.error.split('\n')[0]}` })
      continue
    }
    const artifactCode = fromHex(build.codeHex)
    const { match, evidence } = compareRuntime(chainCode, artifactCode, build.immutableReferences)
    if (match) {
      log(`  PROVEN ${task.chainId}/${task.key} <- ${label} (${c.origin})`)
      return {
        chainId: task.chainId,
        key: task.key,
        address: task.address,
        status: 'PROVEN',
        matched: { ...c, effectiveProfile: build.effectiveProfile, sources: build.sources },
        strippedSha256: evidence.strippedChainSha256,
        chainCodeSize: evidence.chainCodeSize,
        attempts,
      }
    }
    attempts.push({
      candidate: label,
      origin: c.origin,
      result:
        evidence.chainCodeSize !== evidence.artifactCodeSize
          ? `size ${evidence.chainCodeSize} vs ${evidence.artifactCodeSize}`
          : `diverges at ${evidence.firstDivergence}`,
    })
  }

  log(`  UNPROVEN ${task.chainId}/${task.key} after ${attempts.length} candidates`)
  return {
    chainId: task.chainId,
    key: task.key,
    address: task.address,
    status: 'UNPROVEN',
    chainCodeSize: chainCode.length,
    attempts,
  }
}
