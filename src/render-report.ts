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
 *     --swap-management sm.json --audits audits.json --notes n.json --out verify/
 */
import { parseArgs } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNetworks } from './networks.js'
import type { ComponentBaseline } from './run-baselines.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

interface Outcome {
  chainId: number
  key: string
  address: string
  status: string
  matched?: { repo: string; commit: string; contractName: string }
  strippedSha256?: string
}
interface ManifestEntry {
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
interface PairDiff {
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
interface ModuleRec {
  module: string
  address: string
  verdict: string
  crossCheckedInImplementation: boolean
}
interface SwapMgmtRec {
  managementAddress?: string
  verdict?: string
  crossCheckedInImplementation?: boolean
  error?: string
}
interface AuditEntry {
  id: string
  firm: string
  date: string | null
  report: string
}
interface Note {
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
      out: { type: 'string' },
      'engine-ref': { type: 'string' },
    },
  })
  if (!values.manifest || !values.outcomes || !values.baselines || !values.diffs || !values.out) {
    console.error('usage: render-report --manifest m --outcomes o --baselines b --diffs d --out dir [--modules m] [--swap-management s] [--audits a] [--notes n]')
    return 1
  }

  const read = <T>(p: string): T => JSON.parse(readFileSync(resolve(p), 'utf8')) as T
  const manifest = read<Record<string, Record<string, ManifestEntry>>>(values.manifest)
  const outcomes = read<Outcome[]>(values.outcomes)
  const { components } = read<{ components: ComponentBaseline[] }>(values.baselines)
  const pairs = read<PairDiff[]>(values.diffs)
  const diffsDir = dirname(resolve(values.diffs))
  const modules = values.modules ? read<Record<string, { implementation?: string; modules?: ModuleRec[] }>>(values.modules) : {}
  const swapMgmt = values['swap-management'] ? read<Record<string, SwapMgmtRec>>(values['swap-management']) : {}
  const audits = values.audits ? read<AuditEntry[]>(values.audits) : []
  const auditById = new Map(audits.map((a) => [a.id, a]))
  const notes = values.notes ? read<Record<string, Record<string, Note>>>(values.notes) : {}

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

  const networks = loadNetworks(ROOT)
  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })

  const byChain = new Map<number, Outcome[]>()
  for (const o of outcomes) byChain.set(o.chainId, [...(byChain.get(o.chainId) ?? []), o])

  const indexRows: string[] = []

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
    lines.push('Verification = on-chain runtime bytecode ≡ compile(repo@commit, profile), metadata stripped, immutables masked, embedded child-metadata digests zeroed. The block explorer is never in the trust path. Each proven pin is then diffed against its component\'s audited baseline — the fixes-included state of the component\'s most recent audit — so every deployed source delta beyond audited code is shown below as a real diff. Re-run: see the repository README.')
    lines.push('')

    // ─── Attention first: unproven, waived, and medium+ findings ───
    const unprovenRows = rows.filter((r) => r.status !== 'PROVEN' && r.status !== 'CANONICAL' && !entryOf(r.key)?.waiver)
    const waivedRows = rows.filter((r) => entryOf(r.key)?.waiver)
    const findingRows = rows.filter((r) => {
      const n = noteFor(chainId, r.key, entryOf(r.key)?.commit)
      return n && (n.flag || n.severity === 'medium') && r.status === 'PROVEN'
    })
    if (unprovenRows.length || waivedRows.length || findingRows.length) {
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
      for (const r of findingRows) {
        const n = noteFor(chainId, r.key, entryOf(r.key)?.commit)!
        lines.push(`- **${r.key}** — post-audit functionality change ([diff below](#component-${keyToComponent.get(r.key)?.component.toLowerCase() ?? ''})):`)
        lines.push(...renderNote(n))
      }
      lines.push('')
    } else {
      lines.push('**No attention items on this chain: every contract is bytecode-proven and matches or is reconciled to its audited baseline.**')
      lines.push('')
    }

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
          baselineCell =
            pair.files === 0
              ? '≡ baseline'
              : pair.predatesBaseline
                ? `predates (+${pair.insertions}/−${pair.deletions} audited later)`
                : `+${pair.insertions}/−${pair.deletions} vs baseline`
          deltaCell = pair.files === 0 ? '—' : (pair.pinNote?.label ?? 'see diff below')
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
      lines.push('| Contract | Address | Source | Bytecode | vs audited baseline | What changed |')
      lines.push('|----------|---------|--------|----------|---------------------|--------------|')
      lines.push(...grows)
      lines.push('')
    }

    // ─── Unpacked implementations: EVault modules + EulerSwap management ───
    const mod = modules[String(chainId)]
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
    const sm = swapMgmt[String(chainId)]
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
          lines.push(`_Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${spec.componentPaths.join(' ')}\` in ${p.repo}._`)
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
    lines.push(`_Generated by euler-verifier${values['engine-ref'] ? ` @ ${values['engine-ref']}` : ''}; inputs: verify/manifest.json, verify/audits.json, verify/baselines.json._`)
    writeFileSync(join(outDir, `${chainId}.md`), lines.join('\n') + '\n')
    indexRows.push(`| [${net?.name ?? chainId}](${chainId}.md) | ${chainId} | ${proven}/${rows.length}${waived ? ` (+${waived} waived)` : ''}${canonical ? ` (+${canonical} canonical)` : ''} |`)
    console.log(`rendered ${chainId}.md (${proven}/${rows.length})`)
  }

  const index = [
    '# Deployed Code Verification Reports',
    '',
    'Bytecode-level verification of every allowlisted Euler contract: on-chain code is proven equal to a commit-pinned local build (metadata stripped, immutables masked) — the block explorer is never in the trust path — then each deployment is diffed against its component\'s audited baseline: the fixes-included state of the component\'s most recent audit. Reports lead with anything requiring attention and show every deployed source delta beyond audited code as a real diff. Reproducible by anyone.',
    '',
    '| Network | Chain ID | Proven |',
    '|---------|----------|--------|',
    ...indexRows,
    '',
    '_Inputs: `manifest.json` (declared provenance, SHA-only), `audits.json` (audit registry), `baselines.json` (component baselines with derivations). Regenerated only when a PR changes those inputs or addresses._',
  ]
  writeFileSync(join(outDir, 'README.md'), index.join('\n') + '\n')
  return existsSync(outDir) ? 0 : 1
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
