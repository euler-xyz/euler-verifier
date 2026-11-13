#!/usr/bin/env tsx
/**
 * Component-baseline diffs: every component has ONE
 * baseline — the fixes-included state of its LAST audit (manifests/
 * baselines.json). Each proven pin is diffed against that single baseline,
 * restricted to the component's source paths. Pins that predate the baseline
 * still diff against it; the report carries the pin's natural-baseline
 * justification from baselines.json.
 *
 *   pnpm tsx src/run-baselines.ts --manifest <file> --baselines <file> \
 *     --out <dir> [--repos-dir <dir>]
 */
import { parseArgs } from 'node:util'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureClone, ensureCommit } from './compile.js'
import { githubSlug } from './candidates.js'
import { isEntrypoint } from './entrypoint.js'

const exec = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIFF_EMBED_CAP = 400

export interface PinNote {
  relation?: string
  summary?: string
  label?: string
  /** Per-contract "What changed" labels, for keys whose own compilation units differ. */
  labels?: Record<string, string>
  /** Registry ids of audits that reviewed this pin's delta. */
  audits?: string[]
  naturalBaseline?: { auditId: string; justification: string } | null
}

export interface LibComponent {
  repo: string
  gitlinkPath: string
  componentPaths: string[]
  lastAudit: { id: string; date: string; finalReviewedCommit: string }
  baseline: { commit: string; date: string; derivation: string; confidence: string }
}

export interface ComponentBaseline {
  component: string
  repo: string
  keys: string[]
  componentPaths: string[]
  lastAudit: { id: string; date: string; finalReviewedCommit: string }
  baseline: { commit: string; date: string; derivation: string; confidence: string }
  pinNotes?: Record<string, PinNote>
  libComponents?: LibComponent[]
  coversModules?: boolean
}

interface SubmoduleOverride {
  path: string
  ref: string
}

interface ManifestEntry {
  repo?: string
  commit?: string
  waiver?: unknown
  verified?: string
  evidence?: { submoduleOverrides?: SubmoduleOverride[] }
}

async function git(repoDir: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', ['-C', repoDir, ...args], { maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

async function relation(repoDir: string, baseline: string, pin: string): Promise<string> {
  if (pin === baseline) return 'equals-baseline'
  const isAncestor = async (a: string, b: string) =>
    exec('git', ['-C', repoDir, 'merge-base', '--is-ancestor', a, b]).then(
      () => true,
      () => false,
    )
  if (await isAncestor(baseline, pin)) return 'descendant-of-baseline'
  if (await isAncestor(pin, baseline)) return 'predates-baseline'
  return 'divergent'
}

/**
 * The relation of a lib ref to its baseline, judged on the lib's files: a ref
 * on a side branch (e.g. EVC's unmerged set-size branch) whose lib files equal
 * their state at the merge base predates the baseline for this purpose.
 */
async function libRelation(repoDir: string, baseline: string, ref: string, paths: string[]): Promise<string> {
  const rel = await relation(repoDir, baseline, ref)
  if (rel !== 'divergent') return rel
  const base = (await git(repoDir, ['merge-base', baseline, ref]).catch(() => '')).trim()
  if (!base) return rel
  const changed = (await git(repoDir, ['diff', '--name-only', base, ref, '--', ...paths])).trim()
  return changed ? rel : 'predates-baseline'
}

/** Identifies the content of `paths` at `from` and at `to`, so equal diffs under different refs share it. */
async function contentKey(repoDir: string, from: string, to: string, paths: string[]): Promise<string> {
  const trees = await Promise.all([from, to].map((c) => git(repoDir, ['ls-tree', '-r', c, '--', ...paths])))
  return createHash('sha256').update(trees.join('\0')).digest('hex').slice(0, 16)
}

async function gitlinkAt(repoDir: string, commit: string, path: string): Promise<string | null> {
  return (await git(repoDir, ['ls-tree', commit, path])).trim().split(/\s+/)[2] ?? null
}

async function diffPair(
  repoDir: string,
  baseline: string,
  pin: string,
  paths: string[],
): Promise<{ files: number; insertions: number; deletions: number; numstat: string; diff: string }> {
  // -M pairs renames (e.g. src/OracleFactory/ -> src/EulerRouterFactory/) so a
  // moved-but-unchanged file doesn't read as a full delete+add.
  const numstat = (await git(repoDir, ['diff', '-M', '--numstat', baseline, pin, '--', ...paths])).trim()
  let files = 0
  let insertions = 0
  let deletions = 0
  for (const line of numstat.split('\n').filter(Boolean)) {
    const [ins, del] = line.split('\t')
    files += 1
    insertions += Number(ins) || 0
    deletions += Number(del) || 0
  }
  const diff = files === 0 ? '' : await git(repoDir, ['diff', '-M', baseline, pin, '--', ...paths])
  return { files, insertions, deletions, numstat, diff }
}

export interface PairDiff {
  component: string
  repo: string
  pin: string
  /** Distinguishes builds of one pin with different submodule overrides; empty without overrides. */
  variant: string
  baseline: string
  lastAudit: ComponentBaseline['lastAudit']
  relation: string
  predatesBaseline: boolean
  diffDirection: string
  chains: string[]
  keys: string[]
  files: number
  insertions: number
  deletions: number
  numstat: string
  diffFile: string | null
  diffEmbeddable: boolean
  pinNote: PinNote | null
  /** Submodules the build replaced, with the gitlink each replaced. */
  overrides: Array<SubmoduleOverride & { gitlink: string | null }>
  libComponents: LibDiff[]
}

export interface LibDiff {
  repo: string
  gitlinkPath: string
  componentPaths: string[]
  /** The lib commit that was compiled: the override when the build had one, else the pin's gitlink. */
  ref: string
  refSource: 'gitlink' | 'override'
  pinGitlink: string | null
  baseline: string
  lastAudit: LibComponent['lastAudit']
  relation: string
  files: number
  insertions: number
  deletions: number
  numstat: string
  diffFile: string | null
  diffEmbeddable: boolean
  /** Equal for every lib diff with the same files on both sides. */
  contentKey: string
  /** The compiled lib against the lib version the component's own baseline compiled. */
  vsComponentBaseline: { ref: string; files: number; insertions: number; deletions: number } | null
}

export function libDiffFile(component: string, pin: string, libRepo: string, variant = ''): string {
  return `diff-${component}-${pin.slice(0, 8)}${variant ? `-${variant}` : ''}-lib-${libRepo.split('/')[1]}.patch`
}

function overridesVariant(overrides: SubmoduleOverride[]): string {
  if (!overrides.length) return ''
  const canonical = [...overrides].sort((a, b) => a.path.localeCompare(b.path)).map((o) => `${o.path}@${o.ref}`).join(',')
  return createHash('sha256').update(canonical).digest('hex').slice(0, 8)
}

interface PinBuild {
  reposDir: string
  outDir: string
  repoDir: string
  spec: ComponentBaseline
  pin: string
  variant: string
  overrides: SubmoduleOverride[]
}

async function diffLib(build: PinBuild, lib: LibComponent): Promise<LibDiff | null> {
  const { reposDir, outDir, repoDir, spec, pin, variant, overrides } = build
  const pinGitlink = await gitlinkAt(repoDir, pin, lib.gitlinkPath)
  const override = overrides.find((o) => o.path === lib.gitlinkPath)
  const ref = override?.ref ?? pinGitlink
  if (!ref) return null
  const libDir = await ensureClone(reposDir, lib.repo)
  await ensureCommit(libDir, lib.baseline.commit)
  await ensureCommit(libDir, ref)
  const rel = await libRelation(libDir, lib.baseline.commit, ref, lib.componentPaths)
  const [from, to] = rel === 'predates-baseline' ? [ref, lib.baseline.commit] : [lib.baseline.commit, ref]
  const d = await diffPair(libDir, from, to, lib.componentPaths)
  const file = libDiffFile(spec.component, pin, lib.repo, variant)
  if (d.diff) writeFileSync(join(outDir, file), d.diff)
  const vsComponentBaseline = await vsBaselineLib(libDir, repoDir, spec.baseline.commit, lib, ref)
  return {
    repo: lib.repo,
    gitlinkPath: lib.gitlinkPath,
    componentPaths: lib.componentPaths,
    ref,
    refSource: override ? 'override' : 'gitlink',
    pinGitlink,
    baseline: lib.baseline.commit,
    lastAudit: lib.lastAudit,
    relation: rel,
    files: d.files,
    insertions: d.insertions,
    deletions: d.deletions,
    numstat: d.numstat,
    diffFile: d.diff ? file : null,
    diffEmbeddable: d.diff !== '' && d.diff.split('\n').length <= DIFF_EMBED_CAP,
    contentKey: await contentKey(libDir, from, to, lib.componentPaths),
    vsComponentBaseline,
  }
}

/**
 * The lib as compiled against the version the component's own baseline
 * compiled; null when the baseline has no such gitlink or its commit cannot
 * be fetched, so one missing commit never stops a render.
 */
async function vsBaselineLib(libDir: string, repoDir: string, baseline: string, lib: LibComponent, ref: string): Promise<LibDiff['vsComponentBaseline']> {
  const baseRef = await gitlinkAt(repoDir, baseline, lib.gitlinkPath)
  if (!baseRef) return null
  try {
    await ensureCommit(libDir, baseRef)
    const v = await diffPair(libDir, baseRef, ref, lib.componentPaths)
    return { ref: baseRef, files: v.files, insertions: v.insertions, deletions: v.deletions }
  } catch {
    return null
  }
}

/**
 * The commit `path` records at `commit`, following nested submodules
 * (`lib/a/lib/b`) through each parent's .gitmodules URL. Null when it cannot
 * be resolved.
 */
async function recordedGitlink(reposDir: string, repoDir: string, commit: string, path: string): Promise<string | null> {
  const direct = await gitlinkAt(repoDir, commit, path)
  if (direct) return direct
  const config = await git(repoDir, ['config', '--blob', `${commit}:.gitmodules`, '--get-regexp', '^submodule\\..*\\.(path|url)$']).catch(() => '')
  const fields = new Map<string, { path?: string; url?: string }>()
  for (const line of config.trim().split('\n').filter(Boolean)) {
    const m = /^submodule\.(.+)\.(path|url) (.+)$/.exec(line)
    if (m) fields.set(m[1]!, { ...fields.get(m[1]!), [m[2]!]: m[3]! })
  }
  const parent = [...fields.values()]
    .filter((f): f is { path: string; url: string } => !!f.path && !!f.url && path.startsWith(`${f.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  const slug = parent ? githubSlug(parent.url) : null
  const parentCommit = parent ? await gitlinkAt(repoDir, commit, parent.path) : null
  if (!parent || !slug || !parentCommit) return null
  try {
    const dir = await ensureClone(reposDir, slug)
    await ensureCommit(dir, parentCommit)
    return await recordedGitlink(reposDir, dir, parentCommit, path.slice(parent.path.length + 1))
  } catch {
    return null
  }
}

interface Build {
  spec: ComponentBaseline
  pin: string
  overrides: SubmoduleOverride[]
  chains: string[]
  keys: Set<string>
}

function groupBuilds(manifest: Record<string, Record<string, ManifestEntry>>, components: ComponentBaseline[]): Build[] {
  const keyToComponent = new Map<string, ComponentBaseline>()
  for (const c of components) for (const k of c.keys) keyToComponent.set(k, c)
  const builds = new Map<string, Build>()
  const unmapped = new Set<string>()
  for (const [chain, contracts] of Object.entries(manifest)) {
    for (const [key, entry] of Object.entries(contracts)) {
      if (!entry.commit || entry.waiver || entry.verified === 'canonical') continue
      const spec = keyToComponent.get(key)
      if (!spec) {
        unmapped.add(key)
        continue
      }
      const overrides = entry.evidence?.submoduleOverrides ?? []
      const id = `${spec.component}@${entry.commit}@${overridesVariant(overrides)}`
      const build = builds.get(id) ?? { spec, pin: entry.commit, overrides, chains: [], keys: new Set<string>() }
      if (!build.chains.includes(chain)) build.chains.push(chain)
      build.keys.add(key)
      builds.set(id, build)
    }
  }
  if (unmapped.size) throw new Error(`manifest keys without a component baseline: ${[...unmapped].join(', ')}`)
  return [...builds.values()]
}

async function diffBuild(reposDir: string, outDir: string, { spec, pin, overrides, chains, keys }: Build): Promise<PairDiff> {
  const repoDir = await ensureClone(reposDir, spec.repo)
  await ensureCommit(repoDir, spec.baseline.commit)
  await ensureCommit(repoDir, pin)
  const rel = await relation(repoDir, spec.baseline.commit, pin)
  // A pin that predates the baseline reads pin→baseline: hunks then show what the
  // last audit reviewed that this deployment does not have.
  const predates = rel === 'predates-baseline'
  const [from, to] = predates ? [pin, spec.baseline.commit] : [spec.baseline.commit, pin]
  const d = await diffPair(repoDir, from, to, spec.componentPaths)
  const variant = overridesVariant(overrides)
  const diffFile = `diff-${spec.component}-${pin.slice(0, 8)}${variant ? `-${variant}` : ''}.patch`
  if (d.diff) writeFileSync(join(outDir, diffFile), d.diff)
  const build: PinBuild = { reposDir, outDir, repoDir, spec, pin, variant, overrides }
  const libs: LibDiff[] = []
  for (const lib of spec.libComponents ?? []) {
    const libDiff = await diffLib(build, lib)
    if (libDiff) libs.push(libDiff)
  }
  const recorded: PairDiff['overrides'] = []
  for (const o of overrides) recorded.push({ ...o, gitlink: await recordedGitlink(reposDir, repoDir, pin, o.path) })
  return {
    component: spec.component,
    repo: spec.repo,
    pin,
    variant,
    baseline: spec.baseline.commit,
    lastAudit: spec.lastAudit,
    relation: rel,
    predatesBaseline: predates,
    diffDirection: predates ? 'pin-to-baseline' : 'baseline-to-pin',
    chains: chains.sort((a, b) => Number(a) - Number(b)),
    keys: [...keys].sort(),
    files: d.files,
    insertions: d.insertions,
    deletions: d.deletions,
    numstat: d.numstat,
    diffFile: d.diff ? diffFile : null,
    diffEmbeddable: d.diff !== '' && d.diff.split('\n').length <= DIFF_EMBED_CAP,
    pinNote: spec.pinNotes?.[pin] ?? null,
    overrides: recorded,
    libComponents: libs,
  }
}

/**
 * Diff every distinct (component, pin, submodule overrides) build of
 * `manifest` against the component's baseline, writing the patch files into
 * `outDir`. Clones and fetches what the diffs need under `reposDir`.
 */
export async function computeComponentDiffs(
  manifest: Record<string, Record<string, ManifestEntry>>,
  components: ComponentBaseline[],
  reposDir: string,
  outDir: string,
  log: (line: string) => void = console.log,
): Promise<PairDiff[]> {
  mkdirSync(outDir, { recursive: true })
  const results: PairDiff[] = []
  for (const build of groupBuilds(manifest, components)) {
    const p = await diffBuild(reposDir, outDir, build)
    results.push(p)
    log(`${p.component} @ ${p.pin.slice(0, 10)} [${p.relation}] ${p.files} files +${p.insertions}/-${p.deletions} (${p.chains.length} chains)`)
  }
  return results.sort((a, b) => a.component.localeCompare(b.component) || a.pin.localeCompare(b.pin) || a.variant.localeCompare(b.variant))
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      baselines: { type: 'string' },
      out: { type: 'string' },
      'repos-dir': { type: 'string' },
    },
  })
  if (!values.manifest || !values.baselines || !values.out) {
    console.error('usage: run-baselines --manifest <file> --baselines <file> --out <dir> [--repos-dir d]')
    return 1
  }
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const outDir = resolve(values.out)
  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<
    string,
    Record<string, ManifestEntry>
  >
  const { components } = JSON.parse(readFileSync(resolve(values.baselines), 'utf8')) as {
    components: ComponentBaseline[]
  }

  let results: PairDiff[]
  try {
    results = await computeComponentDiffs(manifest, components, reposDir, outDir)
  } catch (err) {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  writeFileSync(join(outDir, 'component-diffs.json'), JSON.stringify(results, null, 1) + '\n')
  console.log(`\n${results.length} (component, pin) pairs across ${components.length} components`)
  return 0
}

if (isEntrypoint(import.meta.url)) main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
