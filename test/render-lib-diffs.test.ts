import { describe, expect, it } from 'vitest'
import { renderLibDiffs } from '../src/render-report.js'

const lib = {
  repo: 'euler-xyz/ethereum-vault-connector',
  gitlink: 'a7d3c29ef7e4964736e47675e0588630d6afbfd7',
  baseline: '5be2e1b043fe31060528c823cf450c6fd55486d1',
  lastAudit: { id: 'yaudit-evc-2024-comp-fixes' },
  relation: 'descendant-of-baseline',
  files: 1,
  insertions: 130,
  deletions: 42,
  diffFile: 'diff-x-lib.patch',
  diffEmbeddable: true,
}
const specs = [{ repo: lib.repo, baseline: { derivation: 'EVCUtil was last audited at 5be2e1b0.' } }]
const label = (id: string) => id
const read = () => '+uint160 internal constant ACCOUNT_ID_OFFSET = 8;'

describe('embedded lib diffs in a chain report', () => {
  it('shows a lib diff and its derivation once, then points back to it', () => {
    const shown = new Map<string, string>()
    const first = renderLibDiffs([lib], 'swapVerifier', specs, shown, label, read).join('\n')
    const second = renderLibDiffs([lib], 'rEUL', specs, shown, label, read).join('\n')
    expect(first).toContain('_EVCUtil was last audited at 5be2e1b0._')
    expect(first).toContain('ACCOUNT_ID_OFFSET')
    expect(second).toContain('+130/−42')
    expect(second).toContain('Same diff as under [swapVerifier](#component-swapverifier).')
    expect(second).not.toContain('ACCOUNT_ID_OFFSET')
  })

  it('shows an identical lib without a diff', () => {
    const out = renderLibDiffs([{ ...lib, files: 0, insertions: 0, deletions: 0, diffFile: null }], 'evk', specs, new Map(), label, read).join('\n')
    expect(out).toContain('**identical**')
    expect(out).not.toContain('```diff')
  })

  it('says when the submodule predates the lib baseline', () => {
    const out = renderLibDiffs([{ ...lib, relation: 'predates-baseline' }], 'rEUL', specs, new Map(), label, read).join('\n')
    expect(out).toContain('predates its baseline')
    expect(out).toContain('the diff reads submodule→baseline')
  })
})
