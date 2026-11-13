import type { ComponentBaseline, LibDiff, PairDiff } from './run-baselines.js'
import { anchor, commitLink, diffBlock, folded, numstatTable, short } from './render-md.js'
import { libSummaryLines } from './render-libs.js'
import { changeLabel } from './render-table.js'
import { unitFiles } from './unit-scope.js'

export interface SectionContext {
  /** Keys of `pair` deployed at its pin (and its overrides) on this chain. */
  keysOf: (pair: PairDiff) => string[]
  sourcesOf: (key: string) => string[] | undefined
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

export function productName(spec: Pick<ComponentBaseline, 'component' | 'name'>): string {
  return spec.name ?? spec.component
}

function overridesLine(pair: PairDiff): string[] {
  if (!pair.overrides.length) return []
  const parts = pair.overrides.map((o) =>
    o.gitlink ? `\`${o.path}\` at \`${short(o.ref)}\` instead of \`${short(o.gitlink)}\`` : `\`${o.path}\` at \`${short(o.ref)}\` (the commit this source commit records there could not be resolved)`,
  )
  return ['', `Built with dependencies at other commits than this source commit records: ${parts.join('; ')}.`]
}

function olderLines(pair: PairDiff, auditLabel: (id: string) => string): string[] {
  if (!pair.predatesBaseline) return []
  const nb = pair.pinNote?.naturalBaseline
  if (nb) return ['', `This deployment is older than the audited version. It matches the code audited by ${auditLabel(nb.auditId)}: ${nb.justification} The diff below shows what the audited version adds.`]
  return ['', 'This deployment is older than the audited version. The diff below shows what the audited version adds.']
}

function contractsTable(pair: PairDiff, keys: string[], ctx: SectionContext): string[] {
  if (pair.files === 0) return ['', 'The deployed source is the same as the audited version.']
  if (pair.predatesBaseline) return []
  const rows = keys.map((k) => {
    const files = unitFiles(pair.numstat, ctx.sourcesOf(k))
    const changed = files.length ? files.map((f) => `\`${f.paths[f.paths.length - 1]}\` +${f.insertions}/−${f.deletions}`).join('<br>') : 'nothing'
    return `| ${k} | ${changed} | ${changeLabel(pair, k, ctx.sourcesOf(k))} |`
  })
  return ['', '| Contract | Changed since audit | What changed |', '|----------|---------------------|--------------|', ...rows]
}

function diffLines(pair: PairDiff, spec: ComponentBaseline, readDiff: (file: string) => string): string[] {
  if (pair.files === 0) return []
  const what = pair.predatesBaseline ? 'What the audited version adds' : 'Diff since the audited version'
  const summary = `${what} (${pair.files} file${pair.files === 1 ? '' : 's'}, +${pair.insertions}/−${pair.deletions})`
  if (pair.diffFile && pair.diffEmbeddable) return ['', ...diffBlock(readDiff(pair.diffFile), summary)]
  const [from, to] = pair.predatesBaseline ? [pair.pin, pair.baseline] : [pair.baseline, pair.pin]
  const pathspecs = spec.componentPaths.map((s) => (/[():]/.test(s) ? `'${s}'` : s)).join(' ')
  return [
    '',
    ...folded(`${summary}: too long to show here`, [
      ...numstatTable(pair.numstat),
      '',
      `Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${pathspecs}\` in ${pair.repo}, or [compare on GitHub](https://github.com/${pair.repo}/compare/${from}..${to}) (all paths).`,
    ]),
  ]
}

function commitSection(pair: PairDiff, spec: ComponentBaseline, ctx: SectionContext): string[] {
  const keys = ctx.keysOf(pair)
  const modules = spec.coversModules && keys.includes('eVaultImplementation') ? ', and the 8 EVault modules' : ''
  const note = pair.pinNote
  return [
    '',
    `### <a id="${pinAnchor(pair)}"></a>${productName(spec)} @ ${commitLink(pair.repo, pair.pin)}`,
    '',
    `Deployed as: ${keys.join(', ')}${modules}.`,
    '',
    `Audited version: ${commitLink(pair.repo, spec.baseline.commit)} — ${ctx.auditLabel(spec.lastAudit.id)}.`,
    ...overridesLine(pair),
    ...olderLines(pair, ctx.auditLabel),
    ...contractsTable(pair, keys, ctx),
    ...(note?.audits?.length ? ['', `Later audits covering these changes: ${note.audits.map(ctx.auditLabel).join(', ')}.`] : []),
    ...keys.map((k) => ctx.notesFor(k, pair.pin)).filter((n) => n.length).flatMap((n) => ['', ...n]),
    ...diffLines(pair, spec, ctx.readDiff),
    ...libSummaryLines(ctx.libsOf(pair), ctx.libAnchorOf),
    ...(note?.summary && !note.naturalBaseline ? ['', ...folded('Maintainer notes on this commit', [note.summary])] : []),
    '',
    ...folded('How the audited version was chosen', [spec.baseline.derivation]),
  ]
}

export function changeSections(order: string[], pairs: PairDiff[], components: ComponentBaseline[], ctx: SectionContext): string[] {
  if (!pairs.length) return []
  const lines = [
    '',
    '## Changes since audit',
    '',
    'One section per deployed commit: what changed in each contract since the audited version, with the diff.',
  ]
  for (const name of order) {
    const spec = components.find((c) => c.component === name)!
    const own = pairs.filter((p) => p.component === name).sort((a, b) => a.pin.localeCompare(b.pin) || a.variant.localeCompare(b.variant))
    for (const p of own) lines.push(...commitSection(p, spec, ctx))
  }
  return lines
}
