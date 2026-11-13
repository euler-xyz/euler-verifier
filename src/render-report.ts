#!/usr/bin/env tsx
/**
 * Render per-chain verification reports (verify/<chain-key>.md).
 *
 * Reporting model: every component has ONE audited baseline — the
 * fixes-included state of its last full audit (verify/baselines.json). Each
 * deployed pin is diffed against that baseline, and each Euler library
 * compiled into it against the library's own baseline; reports lead with
 * anything needing attention, then show the exact code deltas.
 *
 *   pnpm tsx src/render-report.ts --manifest m.json --outcomes o.json \
 *     --baselines b.json --diffs component-diffs.json --modules mod.json \
 *     --swap-management sm.json --audits audits.json --notes n.json \
 *     --chains EulerChains.json --out verify/ [--chain N]...
 *
 * With --chain, only those reports are written and only their rows in
 * README.md change; the rest of README.md is kept as rendered before.
 */
import { parseArgs } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { loadNetworks } from './networks.js'
import { isEntrypoint } from './entrypoint.js'
import type { ComponentBaseline, PairDiff } from './run-baselines.js'
import { INDEX_INTRO } from './render-text.js'
import type { ProxyInfo } from './render-table.js'
import { renderChain } from './render-chain.js'
import type { NetworkInfo } from './types.js'

export type { PairDiff } from './run-baselines.js'

export interface Outcome {
  chainId: number
  key: string
  address: string
  status: string
  matched?: { repo: string; commit: string; contractName: string; sources?: string[] }
  strippedSha256?: string
}
export interface ManifestEntry {
  repo: string
  commit?: string
  verified?: string
  note?: string
  waiver?: { reason: string; signed_by: string } | null
  proxy?: ProxyInfo
  evidence?: { submoduleOverrides?: Array<{ path: string; ref: string }> }
}
export interface ModuleRec {
  module: string
  address: string
  verdict: string
  crossCheckedInImplementation: boolean
}
export interface SwapMgmtRec {
  managementAddress?: string
  verdict?: string
  crossCheckedInImplementation?: boolean
  error?: string
}
export interface AuditEntry {
  id: string
  firm: string
  date: string | null
  report: string
}
export interface Note {
  severity?: string
  /** Surface above the product table as a neutral factual flag (no severity). */
  flag?: boolean
  assessment: string
  /** When set, the note applies only to entries pinned at one of these commits. */
  pins?: string[]
}

export interface RenderInputs {
  manifest: Record<string, Record<string, ManifestEntry>>
  outcomes: Outcome[]
  components: ComponentBaseline[]
  pairs: PairDiff[]
  /** Directory holding the patch files named in `pairs`. */
  diffsDir: string
  modules: Record<string, { implementation?: string; modules?: ModuleRec[]; error?: string }>
  swapMgmt: Record<string, SwapMgmtRec>
  audits: AuditEntry[]
  notes: Record<string, Record<string, Note>>
  networks: Map<number, NetworkInfo>
  engineRef?: string
  /** Per chain id: keys in the address files that are not in scope. */
  uncovered?: Record<string, string[]>
}

export interface RenderedChain {
  chainId: number
  report: string
  /** This chain's row in the README.md index table. */
  row: string
  proven: number
  total: number
}

export function renderReports(inputs: RenderInputs): RenderedChain[] {
  const byChain = new Map<number, Outcome[]>()
  for (const o of inputs.outcomes) byChain.set(o.chainId, [...(byChain.get(o.chainId) ?? []), o])
  return [...byChain.entries()].sort((a, b) => a[0] - b[0]).map(([chainId, rows]) => renderChain(chainId, rows, inputs))
}

const INDEX_ROW = /^\| \[[^\]]*\]\((\d+)\.md\) \| \d+ \|/

/** The index rows of a rendered README.md, by chain id. */
export function indexRowsOf(readme: string): Map<number, string> {
  const rows = new Map<number, string>()
  for (const line of readme.split('\n')) {
    const m = INDEX_ROW.exec(line)
    if (m) rows.set(Number(m[1]), line)
  }
  return rows
}

export function renderIndex(rows: Map<number, string>): string {
  const indexRows = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row)
  const index = [
    '# Deployed Code Verification Reports',
    '',
    INDEX_INTRO,
    '',
    '| Network | Chain ID | Bytecode-proven (of contracts in scope) |',
    '|---------|----------|-----------------------------------------|',
    ...indexRows,
    '',
    '_Inputs: `manifest.json` (declared provenance, SHA-only), `audits.json` (audit registry), `baselines.json` (component baselines with derivations), and euler-verifier `manifests/attention-notes.json`. Regenerated only when a PR changes those inputs or addresses._',
  ]
  return index.join('\n') + '\n'
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      outcomes: { type: 'string' },
      baselines: { type: 'string' },
      diffs: { type: 'string' },
      modules: { type: 'string' },
      'swap-management': { type: 'string' },
      audits: { type: 'string' },
      notes: { type: 'string' },
      chains: { type: 'string' },
      chain: { type: 'string', multiple: true },
      out: { type: 'string' },
      'engine-ref': { type: 'string' },
    },
  })
  if (!values.manifest || !values.outcomes || !values.baselines || !values.diffs || !values.chains || !values.out) {
    console.error('usage: render-report --manifest m --outcomes o --baselines b --diffs d --chains EulerChains.json --out dir [--modules m] [--swap-management s] [--audits a] [--notes n] [--engine-ref r] [--chain N]...')
    return 1
  }

  const read = <T>(p: string): T => JSON.parse(readFileSync(resolve(p), 'utf8')) as T
  const rendered = renderReports({
    manifest: read<RenderInputs['manifest']>(values.manifest),
    outcomes: read<Outcome[]>(values.outcomes),
    components: read<{ components: ComponentBaseline[] }>(values.baselines).components,
    pairs: read<PairDiff[]>(values.diffs),
    diffsDir: dirname(resolve(values.diffs)),
    modules: values.modules ? read<RenderInputs['modules']>(values.modules) : {},
    swapMgmt: values['swap-management'] ? read<RenderInputs['swapMgmt']>(values['swap-management']) : {},
    audits: values.audits ? read<AuditEntry[]>(values.audits) : [],
    notes: values.notes ? read<RenderInputs['notes']>(values.notes) : {},
    networks: loadNetworks(resolve(values.chains)),
    engineRef: values['engine-ref'],
  })

  const only = values.chain?.map(Number)
  const missing = only?.filter((id) => !rendered.some((r) => r.chainId === id)) ?? []
  if (missing.length) {
    console.error(`no outcomes for chain(s) ${missing.join(', ')}`)
    return 1
  }

  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })
  writeChainReports(outDir, only ? rendered.filter((r) => only.includes(r.chainId)) : rendered, !only)
  return 0
}

/**
 * Write the reports and README.md. Unless `replaceIndex`, README.md keeps the
 * rows of chains not rendered now, so it matches a full render.
 */
export function writeChainReports(outDir: string, rendered: RenderedChain[], replaceIndex: boolean): void {
  const readmePath = join(outDir, 'README.md')
  const kept = !replaceIndex && existsSync(readmePath) ? indexRowsOf(readFileSync(readmePath, 'utf8')) : new Map<number, string>()
  const rows = new Map([...kept, ...rendered.map((r): [number, string] => [r.chainId, r.row])])
  for (const r of rendered) {
    writeFileSync(join(outDir, `${r.chainId}.md`), r.report)
    console.log(`rendered ${r.chainId}.md (${r.proven}/${r.total})`)
  }
  writeFileSync(readmePath, renderIndex(rows))
}

if (isEntrypoint(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err)
      process.exit(1)
    },
  )
}
