import type { ComponentBaseline, LibComponent, LibDiff, PairDiff } from './run-baselines.js'
import { unitScopedDelta } from './unit-scope.js'
import { addressLink, anchor, cell, commitLink, short } from './render-md.js'
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
  component: ComponentBaseline | undefined
  /** Whether this report has a section for the row's component to link to. */
  sectionExists: boolean
  pair: PairDiff | undefined
  proxy: ProxyInfo | undefined
  waived: boolean
  canonicalRepo: string | undefined
  libSpecs: LibComponent[]
  libAnchorOf: (lib: LibDiff) => string
}

function sourceCell(r: RowOutcome, c: RowContext): string {
  if (r.matched) {
    const overrides = c.pair?.overrides.length ?? 0
    const extra = overrides ? ` + ${overrides} submodule override${overrides === 1 ? '' : 's'}` : ''
    const impl = c.proxy ? ` · impl ${addressLink(c.explorerUrl, r.address)}` : ''
    return `${commitLink(r.matched.repo, r.matched.commit, `${r.matched.repo.split('/')[1]}@${short(r.matched.commit)}`)}${extra}${impl}`
  }
  if (r.status === 'CANONICAL') return `[\`${c.canonicalRepo?.split('/')[1] ?? '—'}\`](https://github.com/${c.canonicalRepo})`
  return c.waived ? '—' : '?'
}

function verdictCell(r: RowOutcome, waived: boolean): string {
  if (r.status === 'PROVEN') return `✅ \`${short(r.strippedSha256)}\``
  if (r.status === 'CANONICAL') return '🏛 canonical'
  return waived ? '⚪ waived' : `❌ ${r.status}`
}

function deltaCells(r: RowOutcome, c: RowContext): [string, string] {
  if (r.status === 'CANONICAL') return ['long-established (see Canonical contracts)', 'canonical 2021 token']
  const pair = c.pair
  if (r.status !== 'PROVEN' || !pair) return ['—', '—']
  const unit = unitScopedDelta(pair, r.matched?.sources)
  const libs = libMarker(pair.libComponents.filter((l) => compiles(r.matched?.sources, l)), c.libSpecs, c.libAnchorOf)
  if (pair.files === 0) return [`≡ baseline${libs}`, '—']
  if (unit?.files === 0) return [`≡ baseline (this contract)${libs}`, '—']
  const delta = pair.predatesBaseline
    ? `predates (+${pair.insertions}/−${pair.deletions} audited later)`
    : `+${(unit ?? pair).insertions}/−${(unit ?? pair).deletions} vs baseline`
  const narrower = unit && (unit.files !== pair.files || unit.insertions !== pair.insertions || unit.deletions !== pair.deletions)
  const label = pair.pinNote?.labels?.[r.key] ?? (narrower ? undefined : pair.pinNote?.label) ?? 'see diff below'
  return [`${delta}${libs}`, cell(label)]
}

export function contractRow(r: RowOutcome, c: RowContext): string {
  const contract =
    r.status === 'CANONICAL' ? `[${r.key}](#canonical-contracts)` : c.component && c.sectionExists ? `[${r.key}](#${anchor('component', c.component.component)})` : r.key
  const address = c.proxy ? `${addressLink(c.explorerUrl, c.proxy.address)} (proxy)` : addressLink(c.explorerUrl, r.address)
  const [baseline, changed] = deltaCells(r, c)
  return `| ${contract} | ${address} | ${sourceCell(r, c)} | ${verdictCell(r, c.waived)} | ${baseline} | ${changed} |`
}

export const TABLE_HEADER = [
  '| Contract | Address | Source | Bytecode proof | vs audited baseline | What changed |',
  '|----------|---------|--------|----------------|---------------------|--------------|',
]

interface ModuleRec {
  module: string
  address: string
  verdict: string
  crossCheckedInImplementation: boolean
}

export function modulesSection(explorerUrl: string | undefined, implementation: string | undefined, implPinAnchor: string, mods: ModuleRec[]): string[] {
  if (!mods.length) return []
  const from = implementation ? ` (${addressLink(explorerUrl, implementation)})` : ''
  return [
    '',
    '## EVault modules',
    '',
    `Unpacked from the eVaultImplementation${from} and proven from its pin; see [its section](#${implPinAnchor}).`,
    '',
    '| Module | Address | Bytecode | Address embedded in the implementation |',
    '|--------|---------|----------|-----------------------------------------|',
    ...mods.map((m) => `| ${m.module} | ${addressLink(explorerUrl, m.address)} | ${m.verdict === 'MATCH' ? '✅' : `❌ ${m.verdict}`} | ${m.crossCheckedInImplementation ? '✅' : '❌'} |`),
  ]
}

export function managementSection(
  explorerUrl: string | undefined,
  sm: { managementAddress?: string; verdict?: string; crossCheckedInImplementation?: boolean },
  implPinAnchor: string,
): string[] {
  if (!sm.managementAddress) return []
  return [
    '',
    '## EulerSwap V2 management implementation',
    '',
    `EulerSwap delegatecalls management functions into a separate contract whose address is the public immutable \`managementImpl\`. It is proven from the eulerSwapV2Implementation pin; its source changes since the audited baseline are in [that section](#${implPinAnchor}).`,
    '',
    '| Contract | Address | Bytecode | Address embedded in the implementation |',
    '|----------|---------|----------|-----------------------------------------|',
    `| EulerSwapManagement | ${addressLink(explorerUrl, sm.managementAddress)} | ${sm.verdict === 'MATCH' ? '✅' : `❌ ${sm.verdict}`} | ${sm.crossCheckedInImplementation ? '✅' : '❌'} |`,
  ]
}
