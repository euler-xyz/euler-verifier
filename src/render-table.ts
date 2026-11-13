import type { LibDiff, PairDiff } from './run-baselines.js'
import { unitScopedDelta } from './unit-scope.js'
import { addressLink, cell, commitLink, short } from './render-md.js'
import { compiles, libMarker } from './render-libs.js'

export interface ProxyInfo {
  address: string
  implementation: string
  type?: string
}

export interface RowOutcome {
  key: string
  address: string
  status: string
  matched?: { repo: string; commit: string; sources?: string[] }
  strippedSha256?: string
}

export interface RowContext {
  explorerUrl: string | undefined
  /** The anchor of the section that shows this row's changes, when the report has one. */
  sectionAnchor: string | undefined
  pair: PairDiff | undefined
  proxy: ProxyInfo | undefined
  waived: boolean
  canonicalRepo: string | undefined
  libAnchorOf: (lib: LibDiff) => string
}

/** The "What changed" text for one contract of a pin. */
export function changeLabel(pair: PairDiff, key: string, sources: string[] | undefined): string {
  const unit = unitScopedDelta(pair, sources)
  if (pair.files === 0 || unit?.files === 0) return '—'
  const narrower = unit && (unit.files !== pair.files || unit.insertions !== pair.insertions || unit.deletions !== pair.deletions)
  return cell(pair.pinNote?.labels?.[key] ?? (narrower ? undefined : pair.pinNote?.label) ?? 'see diff')
}

/** The "Since audit" text for one contract of a pin, without library markers. */
export function sinceAudit(pair: PairDiff, sources: string[] | undefined): string {
  if (pair.predatesBaseline) return 'older than the audited version'
  const unit = unitScopedDelta(pair, sources)
  if (pair.files === 0 || unit?.files === 0) return 'same as audited'
  const { insertions, deletions } = unit ?? pair
  return `+${insertions}/−${deletions}`
}

function sourceCell(r: RowOutcome, c: RowContext): string {
  if (r.matched) {
    const overrides = c.pair?.overrides.length ?? 0
    const deps = overrides ? ` · ${overrides} ${overrides === 1 ? 'dependency' : 'dependencies'} at other commits` : ''
    const impl = c.proxy ? ` · implementation ${addressLink(c.explorerUrl, r.address)}` : ''
    return `${commitLink(r.matched.repo, r.matched.commit, `${r.matched.repo.split('/')[1]} @ ${short(r.matched.commit)}`)}${deps}${impl}`
  }
  if (r.status === 'CANONICAL') return `[\`${c.canonicalRepo?.split('/')[1] ?? '—'}\`](https://github.com/${c.canonicalRepo})`
  return c.waived ? '—' : '?'
}

function verdictCell(r: RowOutcome, waived: boolean): string {
  if (r.status === 'PROVEN') return '✅ Matches'
  if (r.status === 'CANONICAL') return '🏛 canonical'
  return waived ? '⚪ waived' : `❌ ${r.status}`
}

function deltaCells(r: RowOutcome, c: RowContext): [string, string] {
  if (r.status === 'CANONICAL') return ['long-established (see Canonical contracts)', 'canonical 2021 token']
  const pair = c.pair
  if (r.status !== 'PROVEN' || !pair) return ['—', '—']
  const libs = libMarker(pair.libComponents.filter((l) => compiles(r.matched?.sources, l)), c.libAnchorOf)
  return [`${sinceAudit(pair, r.matched?.sources)}${libs}`, changeLabel(pair, r.key, r.matched?.sources)]
}

export function contractRow(r: RowOutcome, c: RowContext): string {
  const contract = r.status === 'CANONICAL' ? `[${r.key}](#canonical-contracts)` : c.sectionAnchor ? `[${r.key}](#${c.sectionAnchor})` : r.key
  const address = c.proxy ? `${addressLink(c.explorerUrl, c.proxy.address)} (proxy)` : addressLink(c.explorerUrl, r.address)
  const [since, changed] = deltaCells(r, c)
  return `| ${contract} | ${address} | ${sourceCell(r, c)} | ${verdictCell(r, c.waived)} | ${since} | ${changed} |`
}

export const TABLE_HEADER = [
  '| Contract | Address | Source | Bytecode | Since audit | What changed |',
  '|----------|---------|--------|----------|-------------|--------------|',
]

interface ModuleRec {
  module: string
  address: string
  verdict: string
  crossCheckedInImplementation: boolean
}

const matchCell = (verdict: string | undefined) => (verdict === 'MATCH' ? '✅ Matches' : `❌ ${verdict}`)

export function modulesSection(explorerUrl: string | undefined, implementation: string | undefined, implSection: string, mods: ModuleRec[]): string[] {
  if (!mods.length) return []
  const impl = implementation ? ` (${addressLink(explorerUrl, implementation)})` : ''
  return [
    '',
    '## EVault modules',
    '',
    `Every EVault delegates to these modules. Their addresses are read from the EVault implementation${impl} and confirmed in its code, and they are built from the implementation's commit ([its changes since audit](#${implSection})).`,
    '',
    '| Module | Address | Bytecode | Address confirmed in the implementation |',
    '|--------|---------|----------|------------------------------------------|',
    ...mods.map((m) => `| ${m.module} | ${addressLink(explorerUrl, m.address)} | ${matchCell(m.verdict)} | ${m.crossCheckedInImplementation ? '✅' : '❌'} |`),
  ]
}

export function managementSection(
  explorerUrl: string | undefined,
  sm: { managementAddress?: string; verdict?: string; crossCheckedInImplementation?: boolean },
  implSection: string,
): string[] {
  if (!sm.managementAddress) return []
  return [
    '',
    '## EulerSwap V2 management contract',
    '',
    `EulerSwap pools run their management functions in a separate contract, whose address is stored in the EulerSwap implementation. It is built from the implementation's commit ([its changes since audit](#${implSection})).`,
    '',
    '| Contract | Address | Bytecode | Address confirmed in the implementation |',
    '|----------|---------|----------|------------------------------------------|',
    `| EulerSwapManagement | ${addressLink(explorerUrl, sm.managementAddress)} | ${matchCell(sm.verdict)} | ${sm.crossCheckedInImplementation ? '✅' : '❌'} |`,
  ]
}
