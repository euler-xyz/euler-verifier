import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

/**
 * Audit-frontier reconciliation (plan §2.6): for every source file of a
 * deployed contract, the FRONTIER is the audit with the latest pinned commit
 * (git-ancestry order) whose scope covers that file; the RESIDUAL is the diff
 * between that audit's final commit and the deployed commit for that file.
 * A contract is fully audit-covered iff every residual is empty.
 */

export interface AuditEntry {
  id: string
  repo: string
  firm: string
  date: string | null
  commits: { reviewed: string; final: string }
  scope: string[]
  report: string
  confidence: 'high' | 'medium' | 'low'
  signed_off: boolean
}

export type FileClass =
  | { kind: 'covered'; auditId: string; frontierCommit: string }
  | {
      kind: 'unaudited-residual'
      auditId: string
      frontierCommit: string
      added: number
      deleted: number
      /** The actual unified diff (audit frontier -> deployed), capped; the report's primary evidence. */
      diff: string
      diffTruncated: boolean
    }
  | { kind: 'no-audit-found' }
  | { kind: 'external-dependency'; dep: string }
  | { kind: 'build-only' }
  | { kind: 'error'; detail: string }

export interface FileVerdict {
  path: string
  ownerRepo: string
  ownerPath: string
  class: FileClass
  ancestryAmbiguous?: boolean
}

/** lib/<dir> → owning euler repo for cross-repo frontier attribution. */
const LIB_OWNERS: Record<string, string> = {
  'ethereum-vault-connector': 'euler-xyz/ethereum-vault-connector',
  'euler-vault-kit': 'euler-xyz/euler-vault-kit',
  'reward-streams': 'euler-xyz/reward-streams',
  'fee-flow': 'euler-xyz/fee-flow',
  'euler-price-oracle': 'euler-xyz/euler-price-oracle',
  'euler-swap': 'euler-xyz/euler-swap',
  'euler-earn': 'euler-xyz/euler-earn',
  'evk-periphery': 'euler-xyz/evk-periphery',
}

/** Third-party deps: audits assume them correct; not "unaudited Euler code". */
const EXTERNAL_DEPS = new Set([
  'openzeppelin-contracts',
  'openzeppelin-contracts-upgradeable',
  'permit2',
  'forge-std',
  'solmate',
  'solady',
  'layerzero-v2',
  'devtools',
  'LayerZero-v2',
  'v4-core',
  'v4-periphery',
  'uniswap-hooks',
])

const BUILD_ONLY_PREFIXES = ['test/', 'script/', 'certora/']

export function pathOwner(
  path: string,
  selfRepo: string,
): { repo: string; relPath: string } | { external: string } | { buildOnly: true } {
  if (BUILD_ONLY_PREFIXES.some((p) => path.startsWith(p))) return { buildOnly: true }
  if (!path.startsWith('lib/')) return { repo: selfRepo, relPath: path }

  // lib/<dep>/(rest) — possibly nested lib/<a>/lib/<b>/...: attribute to the
  // deepest euler lib; a nested THIRD-PARTY dep is external regardless of
  // which euler lib vendors it.
  const segs = path.split('/')
  let owner: { repo: string; relPath: string } | null = null
  for (let i = 0; i + 1 < segs.length; i += 2) {
    if (segs[i] !== 'lib') break
    const dep = segs[i + 1]!
    if (EXTERNAL_DEPS.has(dep)) return { external: dep }
    const repo = LIB_OWNERS[dep]
    if (!repo) return { external: dep }
    owner = { repo, relPath: segs.slice(i + 2).join('/') }
    if (segs[i + 2] !== 'lib') break
  }
  return owner ?? { external: path }
}

export function scopeMatches(scope: string[], relPath: string): boolean {
  for (const raw of scope) {
    // Normalize common report notations: "src/**", "src/*.sol", trailing "/"
    let s = raw.replace(/\*+\.sol$/, '').replace(/\*+$/, '')
    if (s === '' ) return true
    if (relPath === raw || relPath === s) return true
    if (s.endsWith('/') && relPath.startsWith(s)) return true
    if (!s.endsWith('/') && relPath.startsWith(s) && (relPath.length === s.length || relPath[s.length] === '/' || raw.endsWith('*') || raw.endsWith('*.sol')))
      return true
  }
  return false
}

export type IsAncestor = (repoDir: string, a: string, b: string) => Promise<boolean>

export async function gitIsAncestor(repoDir: string, a: string, b: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['merge-base', '--is-ancestor', a, b], { cwd: repoDir })
    return true
  } catch {
    return false
  }
}

export async function ensureCommit(repoDir: string, commit: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['cat-file', '-t', `${commit}^{commit}`], { cwd: repoDir })
    return true
  } catch {
    try {
      await execFileAsync('git', ['fetch', '--quiet', 'origin', commit], { cwd: repoDir, timeout: 300_000 })
      return true
    } catch {
      return false
    }
  }
}

export interface FrontierPick {
  audit: AuditEntry
  ancestryAmbiguous: boolean
}

/**
 * Pick the frontier audit among candidates covering a file: maximal by git
 * ancestry of `commits.final`; incomparable pairs fall back to date order and
 * are flagged ambiguous.
 */
export async function pickFrontier(
  candidates: AuditEntry[],
  repoDir: string,
  isAncestor: IsAncestor = gitIsAncestor,
): Promise<FrontierPick | null> {
  if (candidates.length === 0) return null
  let best = candidates[0]!
  let ambiguous = false
  for (const c of candidates.slice(1)) {
    const cOverBest = await isAncestor(repoDir, best.commits.final, c.commits.final)
    const bestOverC = await isAncestor(repoDir, c.commits.final, best.commits.final)
    if (cOverBest && !bestOverC) {
      best = c
    } else if (!cOverBest && !bestOverC && best.commits.final !== c.commits.final) {
      // Incomparable branches: latest date wins, flagged.
      ambiguous = true
      if ((c.date ?? '') > (best.date ?? '')) best = c
    }
  }
  return { audit: best, ancestryAmbiguous: ambiguous }
}

const DIFF_LINE_CAP = 300

const diffCache = new Map<string, { added: number; deleted: number; diff: string; diffTruncated: boolean }>()

export async function residualDiff(
  repoDir: string,
  fromCommit: string,
  toCommit: string,
  relPath: string,
): Promise<{ added: number; deleted: number; diff: string; diffTruncated: boolean }> {
  const key = `${repoDir}|${fromCommit}|${toCommit}|${relPath}`
  const hit = diffCache.get(key)
  if (hit) return hit
  const { stdout } = await execFileAsync(
    'git',
    ['diff', '--numstat', `${fromCommit}..${toCommit}`, '--', relPath],
    { cwd: repoDir, timeout: 60_000, maxBuffer: 16 * 1024 * 1024 },
  )
  let added = 0
  let deleted = 0
  for (const line of stdout.trim().split('\n')) {
    if (!line) continue
    const [a, d] = line.split('\t')
    added += Number(a) || 0
    deleted += Number(d) || 0
  }

  let diff = ''
  let diffTruncated = false
  if (added + deleted > 0) {
    // The real code diff is the report's primary evidence — capture it.
    const { stdout: diffOut } = await execFileAsync(
      'git',
      ['diff', '--unified=3', `${fromCommit}..${toCommit}`, '--', relPath],
      { cwd: repoDir, timeout: 60_000, maxBuffer: 32 * 1024 * 1024 },
    )
    const lines = diffOut.split('\n')
    if (lines.length > DIFF_LINE_CAP) {
      diff = lines.slice(0, DIFF_LINE_CAP).join('\n')
      diffTruncated = true
    } else {
      diff = diffOut
    }
  }

  const res = { added, deleted, diff, diffTruncated }
  diffCache.set(key, res)
  return res
}

export interface ClassifyOptions {
  reposDir: string
  audits: AuditEntry[]
  isAncestor?: IsAncestor
}

/**
 * Classify one compiled source file of a contract deployed at
 * (selfRepo @ deployedCommit). Cross-repo files (lib/...) are reconciled
 * against the owning repo's audits at that repo's own pinned state — for lib
 * files the deployed pin is unknown here, so the diff runs frontier→the lib
 * path at the deployed commit of the OWNING repo when resolvable; callers
 * pass libPins when they have them (from submodule gitlinks).
 */
export async function classifyFile(
  compilePath: string,
  selfRepo: string,
  deployedCommit: string,
  opts: ClassifyOptions,
  libPins: Record<string, string> = {},
): Promise<FileVerdict> {
  const owner = pathOwner(compilePath, selfRepo)
  if ('buildOnly' in owner) {
    return { path: compilePath, ownerRepo: selfRepo, ownerPath: compilePath, class: { kind: 'build-only' } }
  }
  if ('external' in owner) {
    return {
      path: compilePath,
      ownerRepo: 'external',
      ownerPath: compilePath,
      class: { kind: 'external-dependency', dep: owner.external },
    }
  }

  const repoDir = join(opts.reposDir, owner.repo.split('/')[1]!)
  const targetCommit = owner.repo === selfRepo ? deployedCommit : libPins[owner.repo]
  if (!targetCommit) {
    return {
      path: compilePath,
      ownerRepo: owner.repo,
      ownerPath: owner.relPath,
      class: { kind: 'error', detail: 'no pinned commit known for owning repo (submodule gitlink unresolved)' },
    }
  }

  const covering = opts.audits.filter((a) => a.repo === owner.repo && a.commits.final && scopeMatches(a.scope, owner.relPath))
  if (covering.length === 0) {
    return { path: compilePath, ownerRepo: owner.repo, ownerPath: owner.relPath, class: { kind: 'no-audit-found' } }
  }

  if (!(await ensureCommit(repoDir, targetCommit))) {
    return {
      path: compilePath,
      ownerRepo: owner.repo,
      ownerPath: owner.relPath,
      class: { kind: 'error', detail: 'target commit unavailable in engine clone' },
    }
  }

  // A file is COVERED if ANY covering audit reviewed exactly this content —
  // deployments legitimately sit between audit revisions (an older audit's
  // exact state, or a newer audit reviewing the same bytes). Otherwise the
  // residual is reported against the audit with the MINIMAL diff, which is
  // the fairest and most reviewable baseline.
  let best: { audit: AuditEntry; added: number; deleted: number; diff: string; diffTruncated: boolean } | null = null
  let anyUsable = false
  for (const audit of covering) {
    const frontierCommit = audit.commits.final
    if (!(await ensureCommit(repoDir, frontierCommit))) continue
    anyUsable = true
    const d = await residualDiff(repoDir, frontierCommit, targetCommit, owner.relPath)
    if (d.added + d.deleted === 0) {
      return {
        path: compilePath,
        ownerRepo: owner.repo,
        ownerPath: owner.relPath,
        class: { kind: 'covered', auditId: audit.id, frontierCommit },
      }
    }
    if (!best || d.added + d.deleted < best.added + best.deleted) {
      best = { audit, ...d }
    }
  }

  if (!anyUsable || !best) {
    return {
      path: compilePath,
      ownerRepo: owner.repo,
      ownerPath: owner.relPath,
      class: { kind: 'error', detail: 'no covering audit commit available in engine clone' },
    }
  }

  return {
    path: compilePath,
    ownerRepo: owner.repo,
    ownerPath: owner.relPath,
    class: {
      kind: 'unaudited-residual',
      auditId: best.audit.id,
      frontierCommit: best.audit.commits.final,
      added: best.added,
      deleted: best.deleted,
      diff: best.diff,
      diffTruncated: best.diffTruncated,
    },
  }
}

/** Read submodule gitlink pins of a repo at a commit: path -> sha. */
export async function submodulePins(repoDir: string, commit: string): Promise<Record<string, string>> {
  const pins: Record<string, string> = {}
  try {
    const { stdout } = await execFileAsync('git', ['ls-tree', '-r', commit], {
      cwd: repoDir,
      maxBuffer: 32 * 1024 * 1024,
    })
    for (const line of stdout.split('\n')) {
      const m = line.match(/^160000 commit ([0-9a-f]{40})\t(.+)$/)
      if (!m) continue
      const dep = m[2]!.split('/').pop()!
      const repo = LIB_OWNERS[dep]
      if (repo) pins[repo] = m[1]!
    }
  } catch {
    // best effort; unresolved pins classify as errors downstream
  }
  return pins
}
