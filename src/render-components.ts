import type { ComponentBaseline, LibDiff, PairDiff } from './run-baselines.js'
import { anchor, commitLink, diffBlock, numstatTable, short } from './render-md.js'
import { confidenceLine } from './render-text.js'
import { libSummaryLines } from './render-libs.js'

export interface SectionContext {
  /** Keys of `pair` deployed at its pin (and its overrides) on this chain. */
  keysOf: (pair: PairDiff) => string[]
  auditLabel: (id: string) => string
  /** The rendered note for a key at a pin (empty when none or when flagged above the table). */
  notesFor: (key: string, pin: string) => string[]
  readDiff: (file: string) => string
  libAnchorOf: (lib: LibDiff) => string
  /** The libs of `pair` that at least one of its contracts on this chain compiles. */
  libsOf: (pair: PairDiff) => LibDiff[]
}

export function pinAnchor(pair: Pick<PairDiff, 'component' | 'pin' | 'variant'>): string {
  return anchor('component', pair.component, short(pair.pin), ...(pair.variant ? [pair.variant] : []))
}

function overridesLine(pair: PairDiff): string[] {
  if (!pair.overrides.length) return []
  const parts = pair.overrides.map((o) =>
    o.gitlink ? `\`${o.path}\` @ \`${short(o.ref)}\` in place of \`${short(o.gitlink)}\`` : `\`${o.path}\` @ \`${short(o.ref)}\` (the commit the pin records there could not be resolved)`,
  )
  return ['', `Built with submodule overrides: ${parts.join('; ')}.`]
}

function pinNoteLines(pair: PairDiff, auditLabel: (id: string) => string): string[] {
  const note = pair.pinNote
  const lines: string[] = []
  if (pair.predatesBaseline && note?.naturalBaseline) {
    const nb = note.naturalBaseline
    lines.push('', `> **This deployment predates the component baseline.** Its own audited anchor is ${auditLabel(nb.auditId)}: ${nb.justification}`, '>', '> The diff below reads pin→baseline: `+` lines are audited code this deployment does not have.')
  } else {
    if (pair.predatesBaseline) lines.push('', 'This deployment predates the baseline. The diff reads pin→baseline: `+` lines are audited code this deployment does not have.')
    if (note?.summary) lines.push('', note.summary)
  }
  if (note?.audits?.length) lines.push('', `Audits covering this delta: ${note.audits.map(auditLabel).join(', ')}.`)
  return lines
}

function deltaLines(pair: PairDiff, spec: ComponentBaseline, readDiff: (file: string) => string): string[] {
  if (pair.files === 0) return ['', "**Deployed source is identical to the audited baseline** on the component's paths."]
  const summary = `Diff vs baseline: ${pair.files} file${pair.files === 1 ? '' : 's'}, +${pair.insertions}/−${pair.deletions}`
  if (pair.diffFile && pair.diffEmbeddable) return ['', ...diffBlock(readDiff(pair.diffFile), summary)]
  const [from, to] = pair.predatesBaseline ? [pair.pin, pair.baseline] : [pair.baseline, pair.pin]
  const pathspecs = spec.componentPaths.map((s) => (/[():]/.test(s) ? `'${s}'` : s)).join(' ')
  return [
    '',
    `${summary}: too long to embed. Per file:`,
    '',
    ...numstatTable(pair.numstat),
    '',
    `Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${pathspecs}\` in ${pair.repo}, or [compare on GitHub](https://github.com/${pair.repo}/compare/${from}..${to}) (all paths).`,
  ]
}

function pinSubsection(pair: PairDiff, spec: ComponentBaseline, ctx: SectionContext): string[] {
  const keys = ctx.keysOf(pair)
  const modules = spec.coversModules && keys.includes('eVaultImplementation') ? ' + the 8 EVault modules' : ''
  return [
    '',
    `#### <a id="${pinAnchor(pair)}"></a>Deployed pin ${commitLink(pair.repo, pair.pin)} — ${keys.join(', ')}${modules}`,
    ...overridesLine(pair),
    ...pinNoteLines(pair, ctx.auditLabel),
    ...keys.map((k) => ctx.notesFor(k, pair.pin)).filter((n) => n.length).flatMap((n) => ['', ...n]),
    ...deltaLines(pair, spec, ctx.readDiff),
    ...libSummaryLines(ctx.libsOf(pair), spec.libComponents ?? [], ctx.libAnchorOf),
  ]
}

export function componentSections(order: string[], pairs: PairDiff[], components: ComponentBaseline[], ctx: SectionContext): string[] {
  if (!pairs.length) return []
  const lines = [
    '',
    '## Audited baselines and deployed deltas',
    '',
    "One baseline per component. An identical result means the deployed source equals the audited code on the component's paths; every other result shows the exact diff.",
  ]
  for (const name of order) {
    const spec = components.find((c) => c.component === name)!
    const own = pairs.filter((p) => p.component === name).sort((a, b) => a.pin.localeCompare(b.pin))
    if (!own.length) continue
    lines.push('', `### <a id="${anchor('component', name)}"></a>${name} — baseline \`${short(spec.baseline.commit)}\` (${ctx.auditLabel(spec.lastAudit.id)})`)
    lines.push('', `_${spec.baseline.derivation}_`)
    const conf = confidenceLine(spec.baseline.confidence)
    if (conf) lines.push('', conf)
    for (const p of own) lines.push(...pinSubsection(p, spec, ctx))
  }
  return lines
}
