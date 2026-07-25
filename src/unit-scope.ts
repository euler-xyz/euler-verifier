/**
 * Scope a component-level baseline diff to a single contract's compilation
 * unit. A component diff spans every file under the component paths, so a
 * sibling contract whose compilation unit contains none of the changed files
 * would otherwise inherit the component's change numbers and label in the
 * per-contract table.
 */

export interface NumstatLine {
  insertions: number
  deletions: number
  /** Both sides of a rename; a single path otherwise. */
  paths: string[]
}

export interface UnitDelta {
  files: number
  insertions: number
  deletions: number
}

interface ScopablePair {
  files: number
  insertions: number
  deletions: number
  numstat: string
  predatesBaseline: boolean
}

/**
 * Expand one `git diff --numstat` path — plain, `old => new`, or the braced
 * `pre{old => new}post` rename form — to its old/new sides.
 */
export function numstatPathSides(raw: string): string[] {
  const brace = /^(.*)\{(.*) => (.*)\}(.*)$/.exec(raw)
  if (brace) {
    const [, pre = '', oldMid = '', newMid = '', post = ''] = brace
    return [`${pre}${oldMid}${post}`, `${pre}${newMid}${post}`].map((p) => p.replace(/\/{2,}/g, '/'))
  }
  const arrow = raw.split(' => ')
  return arrow.length === 2 ? arrow : [raw]
}

/** Parse `git diff --numstat` output into per-file records. */
export function parseNumstat(numstat: string): NumstatLine[] {
  return numstat
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [ins = '', del = '', ...path] = line.split('\t')
      return {
        insertions: Number(ins) || 0,
        deletions: Number(del) || 0,
        paths: numstatPathSides(path.join('\t')),
      }
    })
}

/**
 * Restrict a component diff to the files a contract's compilation unit
 * actually contains (`sources`: the compiled source list of the proven
 * entry, repo-root-relative). Returns the unit-scoped counts, or null when
 * no refinement applies: empty component diff, unavailable source list, an
 * intersection equal to the full changed-file set, or a pin→baseline
 * (predates) diff — whose numbers describe later-audited code that the
 * pin's own source list cannot scope.
 */
export function unitScopedDelta(pair: ScopablePair, sources: string[] | undefined): UnitDelta | null {
  if (pair.files === 0 || pair.predatesBaseline || !sources?.length) return null
  const unit = new Set(sources)
  const lines = parseNumstat(pair.numstat)
  const hits = lines.filter((l) => l.paths.some((p) => unit.has(p)))
  if (hits.length === lines.length) return null
  return {
    files: hits.length,
    insertions: hits.reduce((sum, l) => sum + l.insertions, 0),
    deletions: hits.reduce((sum, l) => sum + l.deletions, 0),
  }
}
