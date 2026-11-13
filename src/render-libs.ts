import type { LibComponent, LibDiff } from './run-baselines.js'
import { anchor, commitLink, diffBlock, folded, numstatTable, short } from './render-md.js'

export interface LibUse {
  key: string
  lib: LibDiff
}

interface Version {
  anchor: string
  lib: LibDiff
  uses: LibUse[]
}

interface LibGroup {
  anchor: string
  name: string
  spec: LibComponent | undefined
  lib: LibDiff
  versions: Version[]
}

/** Whether a contract whose compiled sources are `sources` compiles `lib`; unknown sources count as yes. */
export function compiles(sources: string[] | undefined, lib: LibDiff): boolean {
  if (!sources?.length) return true
  return sources.some((s) => lib.componentPaths.some((p) => s === `${lib.gitlinkPath}/${p}` || (p.endsWith('/') && s.startsWith(`${lib.gitlinkPath}/${p}`))))
}

export function libName(paths: string[]): string {
  return (paths[0] ?? 'lib').split('/').pop()!.replace(/\.sol$/, '')
}

const groupKey = (lib: LibDiff) => `${lib.repo}|${lib.gitlinkPath}|${lib.baseline}`

/**
 * Group the libs compiled on one chain by library and audited version, then by
 * content, so each distinct version is shown once with every contract that
 * compiles it.
 */
export function groupLibs(uses: LibUse[], specs: LibComponent[]): { groups: LibGroup[]; anchorOf: (lib: LibDiff) => string } {
  const groups = new Map<string, LibGroup>()
  for (const use of uses) {
    const spec = specs.find((s) => s.repo === use.lib.repo && s.gitlinkPath === use.lib.gitlinkPath && s.baseline.commit === use.lib.baseline)
    const g = groups.get(groupKey(use.lib)) ?? { anchor: '', name: libName(use.lib.componentPaths), spec, lib: use.lib, versions: [] }
    const v = g.versions.find((x) => x.lib.contentKey === use.lib.contentKey)
    if (v) v.uses.push(use)
    else g.versions.push({ anchor: '', lib: use.lib, uses: [use] })
    groups.set(groupKey(use.lib), g)
  }
  const list = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
  for (const g of list) {
    const clash = list.filter((x) => x.name === g.name).length > 1
    g.anchor = anchor('lib', g.name, ...(clash ? [short(g.lib.baseline)] : []))
    g.versions.forEach((v, i) => (v.anchor = `${g.anchor}-${i + 1}`))
  }
  const anchorOf = (lib: LibDiff) =>
    list.find((g) => groupKey(g.lib) === groupKey(lib))?.versions.find((v) => v.lib.contentKey === lib.contentKey)?.anchor ?? ''
  return { groups: list, anchorOf }
}

const counts = (lib: Pick<LibDiff, 'insertions' | 'deletions'>) => `+${lib.insertions}/−${lib.deletions}`

function versionStatus(lib: LibDiff): string {
  if (lib.files === 0) return 'same as the audited version'
  if (lib.relation === 'predates-baseline') return `older than the audited version (lacks ${counts(lib)})`
  return `${counts(lib)} since the audited version`
}

function versionDiff(lib: LibDiff, readDiff: (file: string) => string): string[] {
  const summary = lib.relation === 'predates-baseline' ? `What the audited version adds (${counts(lib)})` : `Diff since the audited version (${counts(lib)})`
  if (lib.diffFile && lib.diffEmbeddable) return diffBlock(readDiff(lib.diffFile), summary)
  const [from, to] = lib.relation === 'predates-baseline' ? [lib.ref, lib.baseline] : [lib.baseline, lib.ref]
  return folded(summary, [...numstatTable(lib.numstat), '', `Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${lib.componentPaths.join(' ')}\` in ${lib.repo}.`])
}

export function sharedLibrariesSection(groups: LibGroup[], auditLabel: (id: string) => string, readDiff: (file: string) => string): string[] {
  if (!groups.length) return []
  const lines = [
    '',
    '## Shared libraries',
    '',
    "Euler library code compiled into the contracts above, compared with the library's own audited version. Each distinct version appears once, with the contracts it is compiled into.",
  ]
  for (const g of groups) {
    lines.push('', `### <a id="${g.anchor}"></a>${g.name}`, '')
    lines.push(`Audited version: ${commitLink(g.lib.repo, g.lib.baseline)} — ${auditLabel(g.lib.lastAudit.id)}. Source: ${g.lib.componentPaths.map((p) => `\`${p}\``).join(', ')} in ${g.lib.repo}.`)
    if (g.spec?.note) lines.push('', g.spec.note)
    if (g.spec?.baseline.derivation) lines.push('', ...folded('How the audited version was chosen', [g.spec.baseline.derivation]))
    g.versions.forEach((v, i) => {
      const users = v.uses.map((u) => `${u.key} (\`${short(u.lib.ref)}\`${u.lib.refSource === 'override' ? ', dependency at another commit' : ''})`).join(', ')
      lines.push('', `#### <a id="${v.anchor}"></a>${g.name} version ${i + 1}: ${versionStatus(v.lib)}`, '', `Compiled into: ${users}.`)
      if (v.lib.files > 0) lines.push('', ...versionDiff(v.lib, readDiff))
    })
  }
  return lines
}

function vsOwnAudit(lib: LibDiff, href: string): string {
  if (lib.files === 0) return 'the audited version'
  if (lib.relation === 'predates-baseline') return `older than its audited version${href ? ` ([what it lacks](#${href}))` : ''}`
  return `${counts(lib)} since its audited version${href ? ` ([diff](#${href}))` : ''}`
}

function vsAuditedCode(lib: LibDiff): string {
  const v = lib.vsComponentBaseline
  if (!v) return ''
  return v.files === 0 ? '; the same version the audited code compiled' : `; ${counts(v)} against the version the audited code compiled`
}

export function libSummaryLines(libs: LibDiff[], anchorOf: (lib: LibDiff) => string): string[] {
  if (!libs.length) return []
  const lines = libs.map((lib) => {
    const at = `at \`${short(lib.ref)}\`${lib.refSource === 'override' ? ' (dependency at another commit)' : ''}`
    return `- **${libName(lib.componentPaths)}** ${at}: ${vsOwnAudit(lib, anchorOf(lib))}${vsAuditedCode(lib)}.`
  })
  return ['', 'Shared libraries compiled in:', '', ...lines]
}

export function libMarker(libs: LibDiff[], anchorOf: (lib: LibDiff) => string): string {
  const differing = libs.filter((l) => l.files > 0)
  if (!differing.length) return ''
  const parts = differing.map((lib) => {
    const name = libName(lib.componentPaths)
    const status = lib.relation === 'predates-baseline' ? 'older than its audited version' : `${counts(lib)} since its audit`
    return `[${name} ${status}](#${anchorOf(lib)})`
  })
  return ` · ${parts.join(', ')}`
}
