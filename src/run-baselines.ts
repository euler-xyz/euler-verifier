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
import { promisify } from 'node:util'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIFF_EMBED_CAP = 400

export interface PinNote {
  relation?: string
  summary?: string
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

interface ManifestEntry {
  repo?: string
  commit?: string
  waiver?: unknown
  verified?: string
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
  mkdirSync(outDir, { recursive: true })

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<
    string,
    Record<string, ManifestEntry>
  >
  const { components } = JSON.parse(readFileSync(resolve(values.baselines), 'utf8')) as {
    components: ComponentBaseline[]
  }
  const keyToComponent = new Map<string, ComponentBaseline>()
  for (const c of components) for (const k of c.keys) keyToComponent.set(k, c)

  // Distinct (component, pin) pairs; chains/keys accumulate for the report.
  const pairs = new Map<string, { spec: ComponentBaseline; pin: string; chains: string[]; keys: Set<string> }>()
  const unmapped = new Set<string>()
  for (const [chain, contracts] of Object.entries(manifest)) {
    for (const [key, entry] of Object.entries(contracts)) {
      if (!entry.commit || entry.waiver || entry.verified === 'canonical') continue
      const spec = keyToComponent.get(key)
      if (!spec) {
        unmapped.add(key)
        continue
      }
      const id = `${spec.component}@${entry.commit}`
      const pair = pairs.get(id) ?? { spec, pin: entry.commit, chains: [], keys: new Set<string>() }
      if (!pair.chains.includes(chain)) pair.chains.push(chain)
      pair.keys.add(key)
      pairs.set(id, pair)
    }
  }
  if (unmapped.size) {
    console.error(`ERROR: manifest keys without a component baseline: ${[...unmapped].join(', ')}`)
    return 1
  }

  const results = []
  for (const { spec, pin, chains, keys } of pairs.values()) {
    const repoDir = join(reposDir, spec.repo.split('/')[1]!)
    const rel = await relation(repoDir, spec.baseline.commit, pin)
    // For pins that predate the baseline the readable direction is pin→baseline:
    // hunks then show what the last audit reviewed that this deployment predates.
    const predates = rel === 'predates-baseline'
    const [from, to] = predates ? [pin, spec.baseline.commit] : [spec.baseline.commit, pin]
    const d = await diffPair(repoDir, from, to, spec.componentPaths)
    const diffFile = `diff-${spec.component}-${pin.slice(0, 8)}.patch`
    if (d.diff) writeFileSync(join(outDir, diffFile), d.diff)

    // Embedded lib components (e.g. EulerRouter inside EulerRouterFactory):
    // resolve the pin's gitlink and diff the lib against its own baseline.
    const libs = []
    for (const lib of spec.libComponents ?? []) {
      const gitlink = (await git(repoDir, ['ls-tree', pin, lib.gitlinkPath]))
        .trim()
        .split(/\s+/)[2]
      if (!gitlink) continue
      const libDir = join(reposDir, lib.repo.split('/')[1]!)
      const libRel = await relation(libDir, lib.baseline.commit, gitlink)
      const libDiff = await diffPair(libDir, lib.baseline.commit, gitlink, lib.componentPaths)
      const libDiffFile = `diff-${spec.component}-${pin.slice(0, 8)}-lib.patch`
      if (libDiff.diff) writeFileSync(join(outDir, libDiffFile), libDiff.diff)
      libs.push({
        repo: lib.repo,
        gitlinkPath: lib.gitlinkPath,
        gitlink,
        baseline: lib.baseline.commit,
        lastAudit: lib.lastAudit,
        relation: libRel,
        files: libDiff.files,
        insertions: libDiff.insertions,
        deletions: libDiff.deletions,
        numstat: libDiff.numstat,
        diffFile: libDiff.diff ? libDiffFile : null,
        diffEmbeddable: libDiff.diff !== '' && libDiff.diff.split('\n').length <= DIFF_EMBED_CAP,
      })
    }

    results.push({
      component: spec.component,
      repo: spec.repo,
      pin,
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
      libComponents: libs,
    })
    console.log(
      `${spec.component} @ ${pin.slice(0, 10)} [${rel}] ${d.files} files +${d.insertions}/-${d.deletions} (${chains.length} chains)`,
    )
  }

  results.sort((a, b) => a.component.localeCompare(b.component) || a.pin.localeCompare(b.pin))
  writeFileSync(join(outDir, 'component-diffs.json'), JSON.stringify(results, null, 1) + '\n')
  console.log(`\n${results.length} (component, pin) pairs across ${components.length} components`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
