import type { LibComponent, LibDiff } from './run-baselines.js'
import { anchor, diffBlock, numstatTable, short } from './render-md.js'
import { confidenceLine } from './render-text.js'

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
 * Group the libs compiled on one chain by library and baseline, then by
 * content, so each distinct version is shown once with every contract that
 * compiles it.
 */
export function groupLibs(uses: LibUse[], specs: LibComponent[]): { groups: LibGroup[]; anchorOf: (lib: LibDiff) => string } {
  const groups = new Map<string, LibGroup>()
  for (const use of uses) {
    const spec = specs.find((s) => s.repo === use.lib.repo && s.gitlinkPath === use.lib.gitlinkPath && s.baseline.commit === use.lib.baseline)
    const name = libName(spec?.componentPaths ?? [use.lib.gitlinkPath])
    const g = groups.get(groupKey(use.lib)) ?? { anchor: '', name, spec, lib: use.lib, versions: [] }
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

function versionStatus(lib: LibDiff): string {
  if (lib.files === 0) return 'identical to the baseline'
  if (lib.relation === 'predates-baseline') return `predates the baseline (lacks +${lib.insertions}/−${lib.deletions})`
  return `+${lib.insertions}/−${lib.deletions} vs the baseline`
}

export function embeddedLibrariesSection(groups: LibGroup[], auditLabel: (id: string) => string, readDiff: (file: string) => string): string[] {
  if (!groups.length) return []
  const lines = [
    '',
    '## Embedded libraries',
    '',
    "Euler library code compiled into the contracts above from git submodules, compared with each library's own audited baseline. Each distinct compiled version appears once. When a version predates the baseline its diff reads version→baseline, so `+` lines are code that version lacks.",
  ]
  for (const g of groups) {
    const paths = (g.spec?.componentPaths ?? []).map((p) => `\`${p}\``).join(', ')
    lines.push('', `### <a id="${g.anchor}"></a>${g.name} — ${paths} in ${g.lib.repo}, baseline \`${short(g.lib.baseline)}\` (${auditLabel(g.lib.lastAudit.id)})`)
    if (g.spec?.baseline.derivation) lines.push('', `_${g.spec.baseline.derivation}_`)
    const conf = confidenceLine(g.spec?.baseline.confidence)
    if (conf) lines.push('', conf)
    g.versions.forEach((v, i) => {
      const users = v.uses.map((u) => `${u.key} (\`${short(u.lib.ref)}\`${u.lib.refSource === 'override' ? ', override' : ''})`).join(', ')
      lines.push('', `#### <a id="${v.anchor}"></a>Version ${i + 1} — ${versionStatus(v.lib)}`, '', `Compiled by: ${users}`)
      if (v.lib.files === 0) return
      if (v.lib.diffFile && v.lib.diffEmbeddable) lines.push('', ...diffBlock(readDiff(v.lib.diffFile), `Diff, +${v.lib.insertions}/−${v.lib.deletions}`))
      else {
        const [from, to] = v.lib.relation === 'predates-baseline' ? [v.lib.ref, v.lib.baseline] : [v.lib.baseline, v.lib.ref]
        lines.push('', ...numstatTable(v.lib.numstat), '', `Reproduce: \`git diff ${from.slice(0, 12)} ${to.slice(0, 12)} -- ${v.lib.componentPaths.join(' ')}\` in ${v.lib.repo}.`)
      }
    })
  }
  return lines
}

function vsComponentClause(lib: LibDiff, name: string): string {
  const v = lib.vsComponentBaseline
  if (!v) return ''
  if (v.files === 0) return `same ${name} as the component's audited baseline compiled (\`${short(v.ref)}\`); `
  return `+${v.insertions}/−${v.deletions} vs the ${name} the component's audited baseline compiled (\`${short(v.ref)}\`); `
}

function vsOwnClause(lib: LibDiff, name: string, href: string): string {
  if (lib.files === 0) return `identical to ${name}'s own audited baseline \`${short(lib.baseline)}\``
  const link = href ? ` → [version](#${href})` : ''
  if (lib.relation === 'predates-baseline') return `predates ${name}'s own audited baseline \`${short(lib.baseline)}\` by +${lib.insertions}/−${lib.deletions}, code this build lacks${link}`
  return `+${lib.insertions}/−${lib.deletions} vs ${name}'s own audited baseline \`${short(lib.baseline)}\`${link}`
}

export function libSummaryLines(libs: LibDiff[], specs: LibComponent[], anchorOf: (lib: LibDiff) => string): string[] {
  if (!libs.length) return []
  const lines = libs.map((lib) => {
    const name = libName(specs.find((s) => s.repo === lib.repo && s.gitlinkPath === lib.gitlinkPath)?.componentPaths ?? [lib.gitlinkPath])
    const from = lib.refSource === 'override' ? 'submodule override' : 'submodule'
    return `- **${name}** (\`${lib.repo.split('/')[1]}\` @ \`${short(lib.ref)}\`, ${from}): ${vsComponentClause(lib, name)}${vsOwnClause(lib, name, anchorOf(lib))}.`
  })
  return ['', 'Embedded libraries:', '', ...lines]
}

export function libMarker(libs: LibDiff[], specs: LibComponent[], anchorOf: (lib: LibDiff) => string): string {
  const differing = libs.filter((l) => l.files > 0)
  if (!differing.length) return ''
  const parts = differing.map((lib) => {
    const name = libName(specs.find((s) => s.repo === lib.repo && s.gitlinkPath === lib.gitlinkPath)?.componentPaths ?? [lib.gitlinkPath])
    const status = lib.relation === 'predates-baseline' ? `predates its audit (lacks +${lib.insertions}/−${lib.deletions})` : `+${lib.insertions}/−${lib.deletions} vs its audit`
    return `[${name} ${status}](#${anchorOf(lib)})`
  })
  return ` · ${parts.join(', ')}`
}
