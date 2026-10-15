#!/usr/bin/env tsx
/**
 * Render per-chain verification reports (verify/<chain-key>.md).
 *
 * Reporting model: every component has ONE audited baseline — the
 * fixes-included state of its LAST audit (manifests/baselines.json). Each
 * deployed pin is diffed against that single baseline; reports lead with
 * anything needing attention, then show the exact code deltas. Pins that
 * predate their baseline carry the natural-baseline justification.
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
import { unitScopedDelta } from './unit-scope.js'
import { isEntrypoint } from './entrypoint.js'
import type { ComponentBaseline } from './run-baselines.js'
import type { NetworkInfo } from './types.js'

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
}
interface LibDiff {
  repo: string
  gitlink: string
  baseline: string
  lastAudit: { id: string }
  relation: string
  files: number
  insertions: number
  deletions: number
  diffFile: string | null
  diffEmbeddable: boolean
}
export interface PairDiff {
  component: string
  repo: string
  pin: string
  baseline: string
  lastAudit: { id: string }
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
  pinNote: { summary?: string; label?: string; naturalBaseline?: { auditId: string; justification: string } | null } | null
  libComponents: LibDiff[]
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
  /** Surface in the attention block as a neutral factual flag (no severity). */
  flag?: boolean
  assessment: string
  /** When set, the note applies only to entries pinned at one of these commits. */
  pins?: string[]
}

function short(sha?: string): string {
  return sha ? sha.slice(0, 8) : '—'
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
  const { manifest, outcomes, components, pairs, diffsDir, modules, swapMgmt, audits, notes, networks } = inputs
  const auditById = new Map(audits.map((a) => [a.id, a]))

  const noteFor = (chainId: number, key: string, commit?: string): Note | undefined => {
    const n = notes[String(chainId)]?.[key] ?? notes['all']?.[key]
    if (n?.pins && (!commit || !n.pins.includes(commit))) return undefined
    return n
  }
  // 'all'-group notes describe proven-pin deltas; waived/unproven entries have
  // no pin, so they may only carry notes written for this specific chain.
  const chainNoteFor = (chainId: number, key: string): Note | undefined => notes[String(chainId)]?.[key]
  const renderNote = (n: Note): string[] => [
    `  > **Assessment**${n.severity ? ` · severity: **${n.severity}**` : ''}`,
    `  > ${n.assessment.replace(/\n/g, '\n  > ')}`,
  ]
  const auditLabel = (id: string): string => {
    const a = auditById.get(id)
    return a ? `[${a.firm} (\`${id}\`)](${a.report})` : `\`${id}\``
  }

  const keyToComponent = new Map<string, ComponentBaseline>()
  for (const c of components) for (const k of c.keys) keyToComponent.set(k, c)
  const pairFor = (chainId: number, key: string, commit?: string): PairDiff | undefined =>
    pairs.find((p) => p.keys.includes(key) && p.chains.includes(String(chainId)) && (!commit || p.pin === commit))

  const byChain = new Map<number, Outcome[]>()
  for (const o of outcomes) byChain.set(o.chainId, [...(byChain.get(o.chainId) ?? []), o])

  const rendered: RenderedChain[] = []

  for (const [chainId, rows] of [...byChain.entries()].sort((a, b) => a[0] - b[0])) {
    const net = networks.get(chainId)
    const entryOf = (key: string) => manifest[String(chainId)]?.[key]
    const proven = rows.filter((r) => r.status === 'PROVEN').length
    const canonical = rows.filter((r) => r.status === 'CANONICAL').length
    const waived = rows.filter((r) => entryOf(r.key)?.waiver).length
    const lines: string[] = []

    lines.push(`# ${net?.name ?? `Chain ${chainId}`} — Deployed Code Verification`)
    lines.push('')
    lines.push(
      `Chain ID: ${chainId} · Bytecode-proven: **${proven}/${rows.length}**` +
        `${waived ? ` · Waived: ${waived}` : ''}${canonical ? ` · Canonical: ${canonical}` : ''}`,
    )
    lines.push('')
    lines.push('Verification = on-chain runtime bytecode ≡ compile(repo@commit, profile), with the metadata trailer stripped, immutables masked, and the metadata digests of embedded child contracts masked at the offsets the build locates. The block explorer is never in the trust path. This shows runtime correspondence under that normalization, not initialization, governance, immutable configuration or deployment safety. Each proven pin is then diffed against its component\'s audited baseline — the fixes-included state of the component\'s most recent audit — so every deployed source delta beyond audited code is shown below as a real diff. Re-run: see the repository README.')
    lines.push('')

    // ─── Attention first: unproven and waived entries ───
    const unprovenRows = rows.filter((r) => r.status !== 'PROVEN' && r.status !== 'CANONICAL' && !entryOf(r.key)?.waiver)
    const waivedRows = rows.filter((r) => entryOf(r.key)?.waiver)
    const mod = modules[String(chainId)]
    const sm = swapMgmt[String(chainId)]
    const delegatedIssues = [
      ...(mod?.error ? [`**EVault modules** — verification INCOMPLETE: ${mod.error.split('\n')[0]}`] : []),
      ...(mod?.modules ?? []).filter((m) => m.verdict !== 'MATCH' || !m.crossCheckedInImplementation).map((m) => `**EVault module ${m.module}** — FAILED (\`${m.verdict}\`).`),
      ...(sm?.error ? [`**EulerSwapManagement** — verification INCOMPLETE: ${sm.error.split('\n')[0]}`] : []),
      ...(sm?.managementAddress && (sm.verdict !== 'MATCH' || !sm.crossCheckedInImplementation) ? [`**EulerSwapManagement** — FAILED (\`${sm.verdict}\`).`] : []),
    ]
    if (unprovenRows.length || waivedRows.length || delegatedIssues.length) {
      lines.push('## ⚠️ Requires attention')
      lines.push('')
      for (const r of unprovenRows) {
        lines.push(`- **${r.key}** — bytecode NOT proven (\`${r.status}\`). Until proven or waived, treat the deployed code as unverified.`)
        const n = chainNoteFor(chainId, r.key)
        if (n) lines.push(...renderNote(n))
      }
      for (const r of waivedRows) {
        const w = entryOf(r.key)!.waiver!
        lines.push(`- **${r.key}** — waived: ${w.reason} _(signed: ${w.signed_by})_`)
        const n = chainNoteFor(chainId, r.key)
        if (n) lines.push(...renderNote(n))
      }
      for (const issue of delegatedIssues) lines.push(`- ${issue}`)
      lines.push('')
    } else {
      lines.push('**All contracts on this chain are bytecode-proven against their pinned commits.**')
      lines.push('')
    }
    // Flagged assessments (flag or medium severity) render with the product
    // section their contract belongs to, directly above that section's table.
    const flaggedRows = rows.filter((r) => {
      const n = noteFor(chainId, r.key, entryOf(r.key)?.commit)
      return n && (n.flag || n.severity === 'medium') && r.status === 'PROVEN'
    })

    // ─── Contract table ───
    // Three product sections so EulerSwap-specific items never read onto the
    // lending core (and vice versa).
    const groupOf = (key: string) =>
      key.startsWith('eulerEarn') ? 'Euler Earn' : key.startsWith('eulerSwap') ? 'EulerSwap' : 'Core lending protocol'
    const groupRows: Record<string, string[]> = { 'Core lending protocol': [], 'Euler Earn': [], EulerSwap: [] }
    for (const r of [...rows].sort((a, b) => a.key.localeCompare(b.key))) {
      const entry = entryOf(r.key)
      const explorer = net ? `${net.explorerUrl}/address/${r.address}` : ''
      const addr = `[\`${r.address.slice(0, 10)}…\`](${explorer})`
      const src = r.matched
        ? `[\`${r.matched.repo.split('/')[1]}@${short(r.matched.commit)}\`](https://github.com/${r.matched.repo}/tree/${r.matched.commit})`
        : r.status === 'CANONICAL'
          ? `[\`${entry?.repo.split('/')[1] ?? '—'}\`](https://github.com/${entry?.repo})`
          : entry?.waiver
            ? '—'
            : '?'
      const verdict =
        r.status === 'PROVEN'
          ? `✅ \`${short(r.strippedSha256)}\``
          : r.status === 'CANONICAL'
            ? '🏛 canonical'
            : entry?.waiver
              ? `⚪ waived`
              : `❌ ${r.status}`
      let baselineCell = '—'
      let deltaCell = '—'
      if (r.status === 'PROVEN') {
        const pair = pairFor(chainId, r.key, entry?.commit)
        if (pair) {
          // Scope the component-level diff to this contract's own compilation
          // unit (when the outcome carries the compiled source list), so a
          // sibling contract's change never reads onto an unaffected one.
          const unit = unitScopedDelta(pair, r.matched?.sources)
          if (pair.files === 0) {
            baselineCell = '≡ baseline'
          } else if (unit?.files === 0) {
            baselineCell = '≡ baseline (unit)'
          } else if (pair.predatesBaseline) {
            baselineCell = `predates (+${pair.insertions}/−${pair.deletions} audited later)`
          } else {
            const { insertions, deletions } = unit ?? pair
            baselineCell = `+${insertions}/−${deletions} vs baseline`
          }
          deltaCell = pair.files === 0 || unit?.files === 0 ? '—' : (pair.pinNote?.label ?? 'see diff below')
        }
      } else if (r.status === 'CANONICAL') {
        baselineCell = 'long-established (see note)'
        deltaCell = 'canonical 2021 token'
      }
      groupRows[groupOf(r.key)]!.push(`| ${r.key} | ${addr} | ${src} | ${verdict} | ${baselineCell} | ${deltaCell} |`)
    }
    for (const [group, grows] of Object.entries(groupRows)) {
      if (grows.length === 0) continue
      lines.push(`## ${group}`)
      lines.push('')
      for (const r of flaggedRows.filter((f) => groupOf(f.key) === group)) {
        const n = noteFor(chainId, r.key, entryOf(r.key)?.commit)!
        lines.push(`- **${r.key}** — post-audit functionality change ([diff below](#component-${keyToComponent.get(r.key)?.component.toLowerCase() ?? ''})):`)
        lines.push(...renderNote(n))
        lines.push('')
      }
      lines.push('| Contract | Address | Source | Bytecode | vs audited baseline | What changed |')
      lines.push('|----------|---------|--------|----------|---------------------|--------------|')
      lines.push(...grows)
      lines.push('')
    }

    // ─── Unpacked implementations: EVault modules + EulerSwap management ───
    if (mod?.modules?.length) {
      lines.push('')
      lines.push('## EVault modules (unpacked from the implementation)')
      lines.push('')
      lines.push('| Module | Address | Bytecode | Embedded-immutable cross-check |')
      lines.push('|--------|---------|----------|-------------------------------|')
      for (const m of mod.modules) {
        lines.push(`| ${m.module} | \`${m.address}\` | ${m.verdict === 'MATCH' ? '✅' : `❌ ${m.verdict}`} | ${m.crossCheckedInImplementation ? '✅' : '❌'} |`)
      }
    }
    if (sm?.managementAddress) {
      lines.push('')
      lines.push('## EulerSwap V2 management implementation (unpacked from the implementation)')
      lines.push('')
      lines.push('EulerSwap delegatecalls management functions into a separate contract whose address is the public immutable `managementImpl`; it is verified from the same euler-swap pin.')
      lines.push('')
      lines.push('| Contract | Address | Bytecode | Embedded-immutable cross-check |')
      lines.push('|----------|---------|----------|-------------------------------|')
      lines.push(`| EulerSwapManagement | \`${sm.managementAddress}\` | ${sm.verdict === 'MATCH' ? '✅' : `❌ ${sm.verdict}`} | ${sm.crossCheckedInImplementation ? '✅' : '❌'} |`)
    }

    // ─── Component sections: the audited baseline and the exact deployed delta ───
    const chainPairs = pairs
      .filter((p) => p.chains.includes(String(chainId)))
      .sort((a, b) => a.component.localeCompare(b.component))
    if (chainPairs.length) {
      lines.push('')
      lines.push('## Audited baselines and deployed deltas')
      lines.push('')
      lines.push('One baseline per component: the fixes-included state of its most recent audit. Empty deltas mean the deployed source equals the audited code on the component paths; every non-empty delta is shown as the exact diff.')
      for (const p of chainPairs) {
        const spec = components.find((c) => c.component === p.component)!
        lines.push('')
        lines.push(`### <a id="component-${p.component.toLowerCase()}"></a>${p.component} — baseline \`${short(p.baseline)}\` (${auditLabel(p.lastAudit.id)})`)
        lines.push('')
        lines.push(`_${spec.baseline.derivation}_`)
        lines.push('')
        const keysHere = p.keys.filter((k) => manifest[String(chainId)]?.[k]?.commit === p.pin)
        lines.push(`Deployed pin [\`${short(p.pin)}\`](https://github.com/${p.repo}/tree/${p.pin}) (${keysHere.join(', ')}${spec.coversModules ? ' + the 8 EVault modules' : ''}):`)
        lines.push('')
        if (p.predatesBaseline && p.pinNote?.naturalBaseline) {
          const nb = p.pinNote.naturalBaseline
          lines.push(`> **This deployment predates the component baseline.** Its own audited anchor is ${auditLabel(nb.auditId)}: ${nb.justification}`)
          lines.push('>')
          lines.push('> The diff below therefore reads pin→baseline: it shows the audited changes this deployment predates, not unreviewed drift.')
          lines.push('')
        } else if (p.pinNote?.summary) {
          lines.push(`${p.pinNote.summary}`)
          lines.push('')
        }
        for (const k of keysHere) {
          const n = noteFor(chainId, k, p.pin)
          if (n && !n.flag && n.severity !== 'medium') {
            lines.push(...renderNote(n))
            lines.push('')
          }
        }
        if (p.files === 0) {
          lines.push('**Deployed source is identical to the audited baseline** on the component paths.')
        } else if (p.diffFile && p.diffEmbeddable) {
          lines.push('```diff')
          lines.push(readFileSync(join(diffsDir, p.diffFile), 'utf8').trimEnd())
          lines.push('```')
        } else {
          lines.push(`Delta: ${p.files} file(s), +${p.insertions}/−${p.deletions} — too large to embed; per-file:`)
          lines.push('```')
          lines.push(p.numstat)
          lines.push('```')
          const [from, to] = p.predatesBaseline ? [p.pin, p.baseline] : [p.baseline, p.pin]
          const pathspecs = spec.componentPaths.map((s) => (/[():]/.test(s) ? `'${s}'` : s)).join(' ')
          lines.push(`_Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${pathspecs}\` in ${p.repo}._`)
        }
        for (const lib of p.libComponents) {
          lines.push('')
          lines.push(`Embedded \`${lib.repo.split('/')[1]}\` (submodule @ [\`${short(lib.gitlink)}\`](https://github.com/${lib.repo}/tree/${lib.gitlink})) vs its own baseline \`${short(lib.baseline)}\` (${auditLabel(lib.lastAudit.id)}): ${lib.files === 0 ? '**identical**' : `+${lib.insertions}/−${lib.deletions}`}`)
          if (lib.diffFile && lib.diffEmbeddable) {
            lines.push('')
            lines.push('```diff')
            lines.push(readFileSync(join(diffsDir, lib.diffFile), 'utf8').trimEnd())
            lines.push('```')
          }
        }
      }
    }

    // ─── Canonical entries (mainnet EUL) ───
    const canonicalRows = rows.filter((r) => r.status === 'CANONICAL')
    if (canonicalRows.length) {
      lines.push('')
      lines.push('## Canonical contracts')
      lines.push('')
      for (const r of canonicalRows) {
        const entry = entryOf(r.key)
        lines.push(`- **${r.key}** (\`${r.address}\`): ${entry?.note ?? ''}`)
      }
    }

    lines.push('')
    lines.push(`_Generated by euler-verifier${inputs.engineRef ? ` @ ${inputs.engineRef}` : ''}; inputs: verify/manifest.json, verify/audits.json, verify/baselines.json._`)
    rendered.push({
      chainId,
      report: lines.join('\n') + '\n',
      row: `| [${net?.name ?? chainId}](${chainId}.md) | ${chainId} | ${proven}/${rows.length}${waived ? ` (+${waived} waived)` : ''}${canonical ? ` (+${canonical} canonical)` : ''} |`,
      proven,
      total: rows.length,
    })
  }
  return rendered
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
    'Bytecode-level verification of every allowlisted Euler contract: on-chain runtime code is proven equal to a commit-pinned local build (metadata trailer stripped; immutables and build-located embedded metadata digests masked) — the block explorer is never in the trust path — then each deployment is diffed against its component\'s audited baseline: the fixes-included state of the component\'s most recent audit. Reports lead with anything requiring attention and show every deployed source delta beyond audited code as a real diff. Reproducible by anyone. The claim is runtime correspondence under this normalization, not initialization, governance, immutable configuration or deployment safety.',
    '',
    '| Network | Chain ID | Proven |',
    '|---------|----------|--------|',
    ...indexRows,
    '',
    '_Inputs: `manifest.json` (declared provenance, SHA-only), `audits.json` (audit registry), `baselines.json` (component baselines with derivations). Regenerated only when a PR changes those inputs or addresses._',
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
