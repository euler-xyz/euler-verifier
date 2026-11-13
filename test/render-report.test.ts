import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderReports, type ManifestEntry, type RenderInputs } from '../src/render-report.js'
import type { ComponentBaseline, LibDiff, PairDiff } from '../src/run-baselines.js'

const sha = (c: string) => c.repeat(40)
const PIN_IMPL = sha('a')
const PIN_CORE = sha('b')
const BASE = sha('c')
const PIN_RS = sha('1')
const RS_BASE = sha('2')
const LIB_BASE = sha('f')
const LIB_OLD = sha('d')
const LIB_SIDE = sha('e')
const ENGINE = sha('9')

const evcUtil = {
  repo: 'euler-xyz/ethereum-vault-connector',
  gitlinkPath: 'lib/ethereum-vault-connector',
  componentPaths: ['src/utils/EVCUtil.sol'],
  lastAudit: { id: 'audit-evcutil', date: '2026-11-01', finalReviewedCommit: LIB_BASE },
  baseline: { commit: LIB_BASE, date: '2026-10-22', derivation: 'EVCUtil baseline text.', confidence: 'high' },
  note: 'Not reachable from these contracts.',
}

const components: ComponentBaseline[] = [
  {
    component: 'evk',
    name: 'Euler Vault Kit',
    repo: 'euler-xyz/euler-vault-kit',
    keys: ['eVaultFactory', 'eVaultImplementation', 'protocolConfig'],
    componentPaths: ['src/'],
    lastAudit: { id: 'audit-evk', date: '2024-07-31', finalReviewedCommit: BASE },
    baseline: { commit: BASE, date: '2024-07-31', derivation: 'EVK baseline text.', confidence: 'medium' },
    coversModules: true,
    libComponents: [evcUtil],
  },
  {
    component: 'reward-streams',
    repo: 'euler-xyz/reward-streams',
    keys: ['balanceTracker'],
    componentPaths: ['src/'],
    lastAudit: { id: 'audit-rs', date: '2024-07-31', finalReviewedCommit: RS_BASE },
    baseline: { commit: RS_BASE, date: '2024-07-31', derivation: 'RS baseline text.', confidence: 'high' },
    libComponents: [evcUtil],
  },
]

function lib(over: Partial<LibDiff>): LibDiff {
  return {
    repo: evcUtil.repo,
    gitlinkPath: evcUtil.gitlinkPath,
    componentPaths: ['src/utils/EVCUtil.sol'],
    ref: LIB_OLD,
    refSource: 'gitlink',
    pinGitlink: LIB_OLD,
    baseline: LIB_BASE,
    lastAudit: evcUtil.lastAudit,
    relation: 'predates-baseline',
    files: 1,
    insertions: 24,
    deletions: 9,
    numstat: '24\t9\tsrc/utils/EVCUtil.sol',
    diffFile: 'lib-old.patch',
    diffEmbeddable: true,
    contentKey: 'same-content',
    vsComponentBaseline: { ref: LIB_OLD, files: 0, insertions: 0, deletions: 0 },
    ...over,
  }
}

function pair(over: Partial<PairDiff>): PairDiff {
  return {
    component: 'evk',
    repo: 'euler-xyz/euler-vault-kit',
    pin: PIN_CORE,
    variant: '',
    baseline: BASE,
    lastAudit: components[0]!.lastAudit,
    relation: 'descendant-of-baseline',
    predatesBaseline: false,
    diffDirection: 'baseline-to-pin',
    chains: ['1'],
    keys: [],
    files: 2,
    insertions: 3,
    deletions: 3,
    numstat: '1\t1\tsrc/ProtocolConfig.sol\n2\t2\tsrc/Liquidation.sol',
    diffFile: 'core.patch',
    diffEmbeddable: true,
    pinNote: null,
    overrides: [],
    libComponents: [],
    ...over,
  }
}

const proven = (key: string, address: string, repo: string, commit: string, sources: string[]) => ({
  chainId: 1,
  key,
  address,
  status: 'PROVEN',
  matched: { repo, commit, contractName: key, sources },
  strippedSha256: sha('5'),
})

function inputs(extra: Partial<RenderInputs> = {}): RenderInputs {
  const diffsDir = mkdtempSync(join(tmpdir(), 'verifier-render-'))
  writeFileSync(join(diffsDir, 'core.patch'), 'diff --git a/src/ProtocolConfig.sol b/src/ProtocolConfig.sol\n@@ -1,2 +1,2 @@\n-uint16 share = 0.1e4;\n+uint16 share = 0.5e4;\n }\n')
  writeFileSync(join(diffsDir, 'impl.patch'), Array.from({ length: 60 }, (_, i) => ` line ${i}`).join('\n') + '\n')
  writeFileSync(join(diffsDir, 'lib-old.patch'), '+    if (msg.sig == ERC1271) revert();\n')
  const rsOverride = { path: 'lib/ethereum-vault-connector', ref: LIB_SIDE, gitlink: LIB_OLD }
  return {
    manifest: {
      '1': {
        eVaultFactory: { repo: 'euler-xyz/euler-vault-kit', commit: PIN_CORE },
        protocolConfig: { repo: 'euler-xyz/euler-vault-kit', commit: PIN_CORE },
        eVaultImplementation: { repo: 'euler-xyz/euler-vault-kit', commit: PIN_IMPL },
        balanceTracker: {
          repo: 'euler-xyz/reward-streams',
          commit: PIN_RS,
          evidence: { submoduleOverrides: [{ path: rsOverride.path, ref: rsOverride.ref }] },
          proxy: { address: '0x00000000000000000000000000000000000000AA', implementation: '0x00000000000000000000000000000000000000BB', type: 'TransparentUpgradeableProxy (EIP-1967)' },
        },
      },
    },
    outcomes: [
      proven('eVaultFactory', '0x0000000000000000000000000000000000000001', 'euler-xyz/euler-vault-kit', PIN_CORE, ['src/GenericFactory/GenericFactory.sol']),
      proven('protocolConfig', '0x0000000000000000000000000000000000000002', 'euler-xyz/euler-vault-kit', PIN_CORE, ['src/ProtocolConfig.sol']),
      proven('eVaultImplementation', '0x0000000000000000000000000000000000000003', 'euler-xyz/euler-vault-kit', PIN_IMPL, ['src/Liquidation.sol', 'lib/ethereum-vault-connector/src/utils/EVCUtil.sol']),
      proven('balanceTracker', '0x00000000000000000000000000000000000000BB', 'euler-xyz/reward-streams', PIN_RS, ['src/T.sol', 'lib/ethereum-vault-connector/src/utils/EVCUtil.sol']),
    ],
    components,
    pairs: [
      pair({ keys: ['eVaultFactory', 'protocolConfig'], pinNote: { label: 'visibility + fee', labels: { protocolConfig: 'default fee share 10% → 50%' }, audits: ['audit-x'], summary: 'Core pin note.' } }),
      pair({ pin: PIN_IMPL, keys: ['eVaultImplementation'], diffFile: 'impl.patch', numstat: '2\t2\tsrc/Liquidation.sol', insertions: 2, deletions: 2, files: 1, pinNote: { label: 'visibility' }, libComponents: [lib({})] }),
      pair({
        component: 'reward-streams',
        repo: 'euler-xyz/reward-streams',
        pin: PIN_RS,
        baseline: RS_BASE,
        lastAudit: components[1]!.lastAudit,
        keys: ['balanceTracker'],
        files: 0,
        insertions: 0,
        deletions: 0,
        numstat: '',
        diffFile: null,
        overrides: [rsOverride],
        libComponents: [lib({ ref: LIB_SIDE, refSource: 'override' })],
      }),
    ],
    diffsDir,
    modules: { '1': { implementation: '0x0000000000000000000000000000000000000003', modules: [{ module: 'Governance', address: '0x0000000000000000000000000000000000000009', verdict: 'MATCH', crossCheckedInImplementation: true }] } },
    swapMgmt: {},
    audits: [
      { id: 'audit-evk', firm: 'yAudit', date: '2024-07-31', report: 'https://example.com/evk.pdf' },
      { id: 'audit-x', firm: 'Electisec', date: '2025-02-04', report: 'https://example.com/x.pdf' },
      { id: 'audit-evcutil', firm: 'Enigma Dark', date: '2026-11-01', report: 'https://example.com/e.pdf' },
      { id: 'audit-rs', firm: 'yAudit', date: '2024-07-31', report: 'https://example.com/rs.pdf' },
    ],
    notes: { all: { eVaultImplementation: { assessment: 'Plain fact about the implementation.' } } },
    networks: new Map([[1, { chainId: 1, name: 'Ethereum', explorerUrl: 'https://etherscan.io', rpc: [] } as never]]),
    engineRef: ENGINE,
    uncovered: { '1': ['accountLens', 'eVaultFactoryGovernor'] },
    ...extra,
  }
}

const report = (extra: Partial<RenderInputs> = {}) => renderReports(inputs(extra))[0]!.report

const rowOf = (r: string, key: string) => r.split('\n').find((l) => l.startsWith(`| [${key}]`) || l.startsWith(`| ${key} |`))!
/** The text of the section whose heading carries `id`, up to the next section heading. */
function section(r: string, id: string): string {
  const start = r.indexOf(`<a id="${id}"></a>`)
  const next = r.slice(start + 1).search(/\n#{2,3} /)
  return next < 0 ? r.slice(start) : r.slice(start, start + 1 + next)
}
const IMPL = `component-evk-${PIN_IMPL.slice(0, 8)}`
const CORE = `component-evk-${PIN_CORE.slice(0, 8)}`

describe('chain report: links and sections', () => {
  it('links each contract to the section of its own deployed commit', () => {
    const r = report()
    expect(rowOf(r, 'protocolConfig')).toContain(`| [protocolConfig](#${CORE}) |`)
    expect(rowOf(r, 'eVaultImplementation')).toContain(`| [eVaultImplementation](#${IMPL}) |`)
    expect(r).not.toContain('id="component-evk"')
  })

  it('opens each commit section with the files changed in each of its contracts', () => {
    const core = section(report(), CORE)
    expect(core).toContain('Euler Vault Kit @ ')
    expect(core).toContain('| protocolConfig | `src/ProtocolConfig.sol` +1/−1 | default fee share 10% → 50% |')
    expect(core).toContain('| eVaultFactory | nothing | — |')
  })

  it('attributes the EVault modules only to the commit that carries eVaultImplementation', () => {
    const r = report()
    expect(section(r, IMPL)).toContain('Deployed as: eVaultImplementation, and the 8 EVault modules.')
    expect(section(r, CORE)).not.toContain('EVault modules')
  })

  it('gives each build of one commit its own anchor', () => {
    const base = inputs()
    const r = report({
      manifest: { '1': { ...base.manifest['1'], protocolConfig: { repo: 'euler-xyz/euler-vault-kit', commit: PIN_CORE, evidence: { submoduleOverrides: [{ path: 'lib/x', ref: sha('3') }] } } } },
      pairs: [
        ...base.pairs.map((p) => (p.pin === PIN_CORE ? { ...p, keys: ['eVaultFactory'] } : p)),
        pair({ keys: ['protocolConfig'], variant: 'abcd1234', overrides: [{ path: 'lib/x', ref: sha('3'), gitlink: sha('4') }] }),
      ],
    })
    expect(r.match(new RegExp(`id="${CORE}"`, 'g'))).toHaveLength(1)
    expect(r.match(new RegExp(`id="${CORE}-abcd1234"`, 'g'))).toHaveLength(1)
    expect(rowOf(r, 'protocolConfig')).toContain(`(#${CORE}-abcd1234)`)
  })

  it('folds maintainer notes on the commit', () => {
    const core = section(report(), CORE)
    expect(core).toContain('<details><summary>Maintainer notes on this commit</summary>\n\nCore pin note.')
  })

  it('folds the diff and the reasoning behind the audited version', () => {
    const core = section(report(), CORE)
    expect(core).toContain('<details><summary>Diff since the audited version (2 files, +3/−3)</summary>')
    expect(core).toContain('+uint16 share = 0.5e4;\n }\n```')
    expect(core).toMatch(/<details><summary>How the audited version was chosen<\/summary>\n\nEVK baseline text\./)
  })
})

describe('chain report: plain language', () => {
  it('uses plain column values', () => {
    const r = report()
    expect(r).toContain('| Contract | Address | Source | Bytecode | Since audit | What changed |')
    expect(rowOf(r, 'eVaultFactory')).toContain('| ✅ Matches | same as audited | — |')
    expect(rowOf(r, 'protocolConfig')).toContain('| +1/−1 | default fee share 10% → 50% |')
  })

  it('names audits by firm and month, keeping the registry id as the link title', () => {
    expect(report()).toContain(`Audited version: [\`cccccccc\`](https://github.com/euler-xyz/euler-vault-kit/tree/${BASE}) — [yAudit, Jul 2024](https://example.com/evk.pdf "audit-evk").`)
  })

  it('does not print baseline confidence', () => {
    expect(report().toLowerCase()).not.toContain('confidence')
  })

  it('labels maintainers notes as not an audit finding', () => {
    const r = report()
    expect(r).toContain('**Euler note**')
    expect(r).toContain('not an audit finding')
  })

  it('explains its terms', () => {
    expect(report()).toContain('How to read this report')
  })

  it('never leaves two blank lines in a row', () => {
    expect(report()).not.toContain('\n\n\n')
  })
})

describe('chain report: shared libraries', () => {
  it('shows a library version once, with every contract it is compiled into', () => {
    const r = report()
    expect(r).toContain('## Shared libraries')
    expect(r.match(/if \(msg\.sig == ERC1271\) revert/g)).toHaveLength(1)
    expect(r).toContain(`Compiled into: balanceTracker (\`${LIB_SIDE.slice(0, 8)}\`, dependency at another commit), eVaultImplementation (\`${LIB_OLD.slice(0, 8)}\`).`)
  })

  it('shows the library note where readers see the library', () => {
    expect(section(report(), 'lib-evcutil')).toContain('Not reachable from these contracts.')
  })

  it('marks a library only on contracts that compile it', () => {
    const base = inputs()
    const r = report({ pairs: base.pairs.map((p) => (p.pin === PIN_CORE ? { ...p, libComponents: [lib({})] } : p)) })
    expect(rowOf(r, 'eVaultImplementation')).toContain('EVCUtil older than its audited version')
    expect(rowOf(r, 'protocolConfig')).not.toContain('EVCUtil')
  })

  it('says when the compiled library is the version the audited code compiled', () => {
    expect(report()).toContain('the same version the audited code compiled')
  })

  it('names the dependencies a build took at other commits', () => {
    const r = report()
    expect(r).toContain(`\`lib/ethereum-vault-connector\` at \`${LIB_SIDE.slice(0, 8)}\` instead of \`${LIB_OLD.slice(0, 8)}\``)
    expect(rowOf(r, 'balanceTracker')).toContain('1 dependency at other commits')
  })
})

describe('chain report: claims and provenance', () => {
  it('states the scope and never claims every contract on the chain', () => {
    const r = report()
    expect(r).toContain('Contracts in scope: 4')
    expect(r).not.toContain('All contracts on this chain')
    expect(r).toContain('Not covered')
    expect(r).toContain('eVaultFactoryGovernor')
  })

  it('shows the proxy users hold and the implementation that matches', () => {
    const row = rowOf(report(), 'balanceTracker')
    expect(row).toContain('(proxy)')
    expect(row).toContain('implementation')
  })

  it('links the later audits a commit note cites', () => {
    expect(section(report(), CORE)).toContain('Later audits covering these changes: [Electisec, Feb 2025](https://example.com/x.pdf "audit-x").')
  })

  it('names the engine commit and every input in the footer', () => {
    const r = report()
    expect(r).toContain(`https://github.com/euler-xyz/euler-verifier/tree/${ENGINE}`)
    expect(r).toContain('manifests/attention-notes.json')
    expect(r).toContain('https://github.com/euler-xyz/euler-verifier#readme')
  })
})

describe('chain report: attention, counts and edge cases', () => {
  const base = inputs()
  const withEntry = (key: string, entry: ManifestEntry) => ({ '1': { ...base.manifest['1'], [key]: entry } })

  it('says when the commit an override replaces could not be resolved', () => {
    const r = report({ pairs: base.pairs.map((p) => (p.component === 'reward-streams' ? { ...p, overrides: [{ ...p.overrides[0]!, gitlink: null }] } : p)) })
    expect(r).toContain('could not be resolved')
  })

  it('leads with mismatches, waivers and delegated failures, counted once each', () => {
    const r = report({
      outcomes: base.outcomes.map((o) => (o.key === 'protocolConfig' ? { ...o, status: 'MISMATCH', matched: undefined } : o.key === 'balanceTracker' ? { ...o, status: 'WAIVED', matched: undefined } : o)),
      manifest: withEntry('balanceTracker', { ...base.manifest['1']!.balanceTracker!, waiver: { reason: 'size-fit variant', signed_by: 'ops' } }),
      modules: { '1': { modules: [{ module: 'Governance', address: '0x0000000000000000000000000000000000000009', verdict: 'MISMATCH', crossCheckedInImplementation: true }] } },
    })
    expect(r).toContain('## ⚠️ Requires attention')
    expect(r).toContain('**protocolConfig** — the deployed bytecode does NOT match its source commit (`MISMATCH`)')
    expect(r).toContain('**balanceTracker** — waived: size-fit variant')
    expect(r).toContain('**EVault module Governance** — FAILED')
    expect(r).toContain('Waived: 1 · Not matching: **1**')
    expect(r).toContain('| balanceTracker |')
  })

  it('counts a canonical entry once even when it also carries a waiver', () => {
    const r = report({
      outcomes: [...base.outcomes, { chainId: 1, key: 'EUL', address: '0x00000000000000000000000000000000000000EE', status: 'CANONICAL' }],
      manifest: withEntry('EUL', { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'Canonical note.', waiver: { reason: 'x', signed_by: 'y' } }),
    })
    expect(r).toContain('Canonical (documented, not rebuilt): 1')
    expect(r).not.toContain('Waived')
    expect(r).not.toContain('Not matching')
    expect(r).toContain('<a id="canonical-contracts"></a>Canonical contracts')
    expect(r).toContain('| [EUL](#canonical-contracts) |')
  })

  it('shows a flagged note once, above the table, linked to its commit', () => {
    const r = report({ notes: { all: { eVaultImplementation: { assessment: 'Flagged fact.', flag: true } } } })
    expect(r).toContain(`**eVaultImplementation** — changed after its audit ([see the changes](#${IMPL}))`)
    expect(r.match(/Flagged fact\./g)).toHaveLength(1)
  })

  it('explains a deployment older than its audited version', () => {
    const r = report({
      pairs: base.pairs.map((p) =>
        p.pin === PIN_IMPL ? { ...p, predatesBaseline: true, relation: 'predates-baseline', pinNote: { naturalBaseline: { auditId: 'audit-x', justification: 'Older audited state.' } } } : p,
      ),
    })
    expect(rowOf(r, 'eVaultImplementation')).toContain('older than the audited version')
    expect(r).toContain('This deployment is older than the audited version. It matches the code audited by [Electisec, Feb 2025](https://example.com/x.pdf "audit-x"): Older audited state.')
  })

  it('says so when every other address is a multisig', () => {
    expect(report({ uncovered: { '1': [] } })).toContain('Every other non-zero address in the euler-interfaces address files is a multisig Safe.')
  })

  it('treats an empty source list as unknown, not as compiling nothing', () => {
    const r = report({ outcomes: base.outcomes.map((o) => (o.key === 'eVaultImplementation' ? { ...o, matched: { ...o.matched!, sources: [] } } : o)) })
    expect(rowOf(r, 'eVaultImplementation')).toContain('EVCUtil older than its audited version')
  })

  it('escapes a pipe in a label', () => {
    const r = report({ pairs: base.pairs.map((p) => (p.pin === PIN_IMPL ? { ...p, pinNote: { label: 'a | b' } } : p)) })
    expect(rowOf(r, 'eVaultImplementation')).toContain('a \\| b')
  })

  it('gives long diffs a reproduce command and a direct GitHub compare', () => {
    const r = report({
      pairs: base.pairs.map((p) => (p.pin === PIN_IMPL ? { ...p, diffEmbeddable: false, libComponents: [lib({ diffEmbeddable: false, contentKey: 'long-variant' })] } : p)),
    })
    expect(r).toContain(`/compare/${BASE}..${PIN_IMPL})`)
    expect(r).toContain(`Reproduce: \`git diff ${LIB_OLD.slice(0, 12)} ${LIB_BASE.slice(0, 12)} -- src/utils/EVCUtil.sol\``)
  })
})

describe('chain report: failures are not called mismatches', () => {
  const base = inputs()
  const withStatus = (statuses: Record<string, string>) =>
    report({ outcomes: base.outcomes.map((o) => (statuses[o.key] ? { ...o, status: statuses[o.key]!, matched: undefined } : o)) })

  it('calls only a compared, differing build a mismatch', () => {
    const r = withStatus({ protocolConfig: 'MISMATCH', eVaultFactory: 'RPC_ERROR', balanceTracker: 'UNPROVEN' })
    expect(r).toContain('**protocolConfig** — the deployed bytecode does NOT match its source commit (`MISMATCH`)')
    expect(r).toContain('**eVaultFactory** — verification incomplete (`RPC_ERROR`)')
    expect(r).toContain('**balanceTracker** — not proven (`UNPROVEN`)')
    expect(r).toContain('Not matching: **1** · Not proven: **2**')
    expect(rowOf(r, 'eVaultFactory')).toContain('⚠️ Verification incomplete')
    expect(rowOf(r, 'protocolConfig')).toContain('❌ Does not match')
  })

  it('does not call an RPC failure a mismatch anywhere', () => {
    const r = withStatus({ eVaultFactory: 'RPC_ERROR' })
    expect(r).not.toContain('does NOT match')
    expect(r).not.toContain('Not matching')
  })
})

describe('chain report: module scope', () => {
  it('describes the modules of the checked implementation only', () => {
    const r = report()
    expect(r).not.toContain('Every EVault')
    expect(r).toContain('These are the modules of the EVault implementation checked above')
    expect(r).toContain('A non-upgradeable vault keeps the implementation it was created with')
  })
})
