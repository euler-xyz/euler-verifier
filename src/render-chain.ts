import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentBaseline, LibComponent, LibDiff, PairDiff } from './run-baselines.js'
import type { NetworkInfo } from './types.js'
import type { ManifestEntry, Note, Outcome, RenderedChain, RenderInputs, SwapMgmtRec } from './render-report.js'
import { footerLine, introLines, legendLines, noteLines } from './render-text.js'
import { contractRow, managementSection, modulesSection, TABLE_HEADER } from './render-table.js'
import { componentSections, pinAnchor } from './render-components.js'
import { compiles, embeddedLibrariesSection, groupLibs, type LibUse } from './render-libs.js'
import { collapseBlankLines } from './render-md.js'

const GROUPS = ['Core lending protocol', 'Euler Earn', 'EulerSwap'] as const
const groupOf = (key: string) => (key.startsWith('eulerEarn') ? GROUPS[1] : key.startsWith('eulerSwap') ? GROUPS[2] : GROUPS[0])

const overridesId = (o: Array<{ path: string; ref: string }> = []) =>
  o.map((x) => `${x.path}@${x.ref}`).sort().join(',')

interface Counts {
  proven: number
  canonical: number
  waived: number
  notProven: number
}

function countsOf(rows: Outcome[], waived: (key: string) => boolean): Counts {
  const isWaived = (r: Outcome) => r.status !== 'CANONICAL' && waived(r.key)
  return {
    proven: rows.filter((r) => r.status === 'PROVEN').length,
    canonical: rows.filter((r) => r.status === 'CANONICAL').length,
    waived: rows.filter(isWaived).length,
    notProven: rows.filter((r) => r.status !== 'PROVEN' && r.status !== 'CANONICAL' && !isWaived(r)).length,
  }
}

function delegatedIssues(mod: RenderInputs['modules'][string] | undefined, sm: SwapMgmtRec | undefined): string[] {
  return [
    ...(mod?.error ? [`**EVault modules** — verification INCOMPLETE: ${mod.error.split('\n')[0]}`] : []),
    ...(mod?.modules ?? []).filter((m) => m.verdict !== 'MATCH' || !m.crossCheckedInImplementation).map((m) => `**EVault module ${m.module}** — FAILED (\`${m.verdict}\`).`),
    ...(sm?.error ? [`**EulerSwapManagement** — verification INCOMPLETE: ${sm.error.split('\n')[0]}`] : []),
    ...(sm?.managementAddress && (sm.verdict !== 'MATCH' || !sm.crossCheckedInImplementation) ? [`**EulerSwapManagement** — FAILED (\`${sm.verdict}\`).`] : []),
  ]
}

function attentionLines(v: ChainView): string[] {
  const { chainId, rows, inputs, counts } = v
  const delegated = delegatedIssues(inputs.modules[String(chainId)], inputs.swapMgmt[String(chainId)])
  if (!counts.notProven && !counts.waived && !delegated.length) {
    if (!counts.canonical) return [`**All ${counts.proven} contracts in scope are bytecode-proven against their pinned commits.**`]
    return [`**All ${counts.proven} contracts in scope that are built from a pinned commit are bytecode-proven.** ${counts.canonical} canonical contract${counts.canonical === 1 ? ' is' : 's are'} documented, not re-proven (see [Canonical contracts](#canonical-contracts)).`]
  }
  const chainNote = (key: string) => {
    const n = inputs.notes[String(chainId)]?.[key]
    return n ? noteLines(n.assessment, n.severity) : []
  }
  const lines = ['## ⚠️ Requires attention', '']
  for (const r of rows.filter((x) => x.status !== 'PROVEN' && x.status !== 'CANONICAL' && !v.entryOf(x.key)?.waiver)) {
    lines.push(`- **${r.key}** — bytecode NOT proven (\`${r.status}\`). Until proven or waived, treat the deployed code as unverified.`, ...chainNote(r.key))
  }
  for (const r of rows.filter((x) => x.status !== 'CANONICAL' && v.entryOf(x.key)?.waiver)) {
    const w = v.entryOf(r.key)!.waiver!
    lines.push(`- **${r.key}** — waived: ${w.reason} _(signed: ${w.signed_by})_`, ...chainNote(r.key))
  }
  return [...lines, ...delegated.map((d) => `- ${d}`)]
}

function headerLine(chainId: number, rows: Outcome[], c: Counts): string {
  return (
    `Chain ID: ${chainId} · Contracts in scope: ${rows.length} · Bytecode-proven: **${c.proven}**` +
    `${c.canonical ? ` · Canonical (documented, not re-proven): ${c.canonical}` : ''}${c.waived ? ` · Waived: ${c.waived}` : ''}${c.notProven ? ` · Not proven: **${c.notProven}**` : ''}`
  )
}

/** Everything one chain's report is rendered from, resolved once. */
interface ChainView {
  chainId: number
  rows: Outcome[]
  inputs: RenderInputs
  counts: Counts
  net: NetworkInfo | undefined
  entryOf: (key: string) => ManifestEntry | undefined
  auditLabel: (id: string) => string
  noteFor: (key: string, commit?: string) => Note | undefined
  isFlagged: (n: Note | undefined) => boolean
  readDiff: (file: string) => string
  componentOf: (key: string) => ComponentBaseline | undefined
  chainPairs: PairDiff[]
  pairFor: (key: string) => PairDiff | undefined
  sorted: Outcome[]
  order: string[]
  libSpecs: LibComponent[]
  libs: ReturnType<typeof groupLibs>
  libsOf: (p: PairDiff) => LibDiff[]
}

function chainView(chainId: number, rows: Outcome[], inputs: RenderInputs): ChainView {
  const { manifest, components, pairs, diffsDir, audits, notes, networks } = inputs
  const entryOf = (key: string) => manifest[String(chainId)]?.[key]
  const auditById = new Map(audits.map((a) => [a.id, a]))
  const keyToComponent = new Map(components.flatMap((c) => c.keys.map((k): [string, ComponentBaseline] => [k, c])))
  const chainPairs = pairs.filter((p) => p.chains.includes(String(chainId)))
  const pairFor = (key: string) => {
    const e = entryOf(key)
    return chainPairs.find((p) => p.keys.includes(key) && p.pin === e?.commit && overridesId(p.overrides) === overridesId(e?.evidence?.submoduleOverrides))
  }
  const sorted = [...rows].sort((a, b) => GROUPS.indexOf(groupOf(a.key)) - GROUPS.indexOf(groupOf(b.key)) || a.key.localeCompare(b.key))
  const proven = sorted.filter((r) => r.status === 'PROVEN')
  const libSpecs = components.flatMap((c) => c.libComponents ?? [])
  const uses: LibUse[] = proven.flatMap((r) => (pairFor(r.key)?.libComponents ?? []).filter((lib) => compiles(r.matched?.sources, lib)).map((lib) => ({ key: r.key, lib })))
  return {
    chainId,
    rows,
    inputs,
    counts: countsOf(rows, (key) => !!entryOf(key)?.waiver),
    net: networks.get(chainId),
    entryOf,
    auditLabel: (id) => {
      const a = auditById.get(id)
      return a ? `[${a.firm} (\`${id}\`)](${a.report})` : `\`${id}\``
    },
    noteFor: (key, commit) => {
      const n = notes[String(chainId)]?.[key] ?? notes['all']?.[key]
      return n?.pins && (!commit || !n.pins.includes(commit)) ? undefined : n
    },
    isFlagged: (n) => !!n && (!!n.flag || n.severity === 'medium'),
    readDiff: (file) => readFileSync(join(diffsDir, file), 'utf8'),
    componentOf: (key) => keyToComponent.get(key),
    chainPairs,
    pairFor,
    sorted,
    order: [...new Set(proven.map((r) => keyToComponent.get(r.key)?.component).filter((c): c is string => !!c))],
    libSpecs,
    libs: groupLibs(uses, libSpecs),
    libsOf: (p) => p.libComponents.filter((lib) => uses.some((u) => u.lib === lib)),
  }
}

function groupTableLines(v: ChainView, group: (typeof GROUPS)[number]): string[] {
  const groupRows = v.sorted.filter((r) => groupOf(r.key) === group)
  if (!groupRows.length) return []
  const lines = [`## ${group}`, '']
  for (const r of groupRows.filter((x) => x.status === 'PROVEN' && v.isFlagged(v.noteFor(x.key, v.entryOf(x.key)?.commit)))) {
    const n = v.noteFor(r.key, v.entryOf(r.key)?.commit)!
    const pair = v.pairFor(r.key)
    lines.push(`- **${r.key}** — post-audit functionality change ([diff below](#${pair ? pinAnchor(pair) : ''})):`, ...noteLines(n.assessment, n.severity), '')
  }
  lines.push(...TABLE_HEADER)
  for (const r of groupRows) {
    const e = v.entryOf(r.key)
    const component = v.componentOf(r.key)
    lines.push(
      contractRow(r, {
        explorerUrl: v.net?.explorerUrl,
        component,
        sectionExists: !!component && v.order.includes(component.component),
        pair: r.status === 'PROVEN' ? v.pairFor(r.key) : undefined,
        proxy: e?.proxy,
        waived: !!e?.waiver,
        canonicalRepo: e?.repo,
        libSpecs: v.libSpecs,
        libAnchorOf: v.libs.anchorOf,
      }),
    )
  }
  return [...lines, '']
}

function deltaSectionLines(v: ChainView): string[] {
  const implPair = v.pairFor('eVaultImplementation')
  const swapPair = v.pairFor('eulerSwapV2Implementation')
  const mod = v.inputs.modules[String(v.chainId)]
  return [
    ...modulesSection(v.net?.explorerUrl, mod?.implementation, implPair ? pinAnchor(implPair) : '', mod?.modules ?? []),
    ...managementSection(v.net?.explorerUrl, v.inputs.swapMgmt[String(v.chainId)] ?? {}, swapPair ? pinAnchor(swapPair) : ''),
    ...componentSections(v.order, v.chainPairs, v.inputs.components, {
      keysOf: (p) => p.keys.filter((k) => v.pairFor(k) === p),
      auditLabel: v.auditLabel,
      notesFor: (key, pin) => {
        const n = v.noteFor(key, pin)
        return n && !v.isFlagged(n) ? noteLines(n.assessment, n.severity) : []
      },
      readDiff: v.readDiff,
      libAnchorOf: v.libs.anchorOf,
      libsOf: v.libsOf,
    }),
    ...embeddedLibrariesSection(v.libs.groups, v.auditLabel, v.readDiff),
  ]
}

export function renderChain(chainId: number, rows: Outcome[], inputs: RenderInputs): RenderedChain {
  const v = chainView(chainId, rows, inputs)
  const canonicalRows = v.sorted.filter((r) => r.status === 'CANONICAL')
  const lines = [
    `# ${v.net?.name ?? `Chain ${chainId}`} — Deployed Code Verification`,
    '',
    headerLine(chainId, rows, v.counts),
    '',
    ...introLines(rows.length, inputs.uncovered?.[String(chainId)]),
    '',
    ...legendLines(),
    '',
    ...attentionLines(v),
    '',
    ...GROUPS.flatMap((g) => groupTableLines(v, g)),
    ...deltaSectionLines(v),
    ...(canonicalRows.length ? ['', '## <a id="canonical-contracts"></a>Canonical contracts', '', ...canonicalRows.map((r) => `- **${r.key}** (\`${r.address}\`): ${v.entryOf(r.key)?.note ?? ''}`)] : []),
    '',
    footerLine(inputs.engineRef),
  ]
  const { proven, canonical, waived } = v.counts
  return {
    chainId,
    report: collapseBlankLines(lines).join('\n') + '\n',
    row: `| [${v.net?.name ?? chainId}](${chainId}.md) | ${chainId} | ${proven} of ${rows.length}${canonical ? ` · ${canonical} canonical` : ''}${waived ? ` · ${waived} waived` : ''} |`,
    proven,
    total: rows.length,
  }
}
