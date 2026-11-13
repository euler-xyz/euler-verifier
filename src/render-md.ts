/** Diffs longer than this many lines render folded inside <details>. */
export const FOLD_LINES = 30

export function short(sha?: string | null): string {
  return sha ? sha.slice(0, 8) : '—'
}

/** Strip only trailing newlines: a diff's last context line starts with a space and must survive. */
export function withoutTrailingNewlines(text: string): string {
  return text.replace(/\n+$/, '')
}

export function diffBlock(diff: string, summary: string): string[] {
  const body = withoutTrailingNewlines(diff)
  const lines = body.split('\n').length
  const fence = ['```diff', body, '```']
  return lines <= FOLD_LINES ? fence : [`<details><summary>${summary} (${lines} lines)</summary>`, '', ...fence, '', '</details>']
}

export function collapseBlankLines(lines: string[]): string[] {
  let fenced = false
  return lines.filter((line, i) => {
    if (line.startsWith('```')) fenced = !fenced
    return fenced || line !== '' || lines[i - 1] !== ''
  })
}

export function addressLink(explorerUrl: string | undefined, address: string): string {
  const label = `\`${address.slice(0, 10)}…\``
  return explorerUrl ? `[${label}](${explorerUrl}/address/${address})` : label
}

export function commitLink(repo: string, commit: string, text = short(commit)): string {
  return `[\`${text}\`](https://github.com/${repo}/tree/${commit})`
}

/** Text safe inside a Markdown table cell. */
export function cell(text: string): string {
  return text.replace(/\|/g, '\\|')
}

export function anchor(...parts: string[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
}

export function numstatTable(numstat: string): string[] {
  const rows = numstat
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [ins, del, ...path] = line.split('\t')
      return `| \`${path.join('\t')}\` | +${ins} | −${del} |`
    })
  return ['| File | Added | Removed |', '|------|-------|---------|', ...rows]
}
