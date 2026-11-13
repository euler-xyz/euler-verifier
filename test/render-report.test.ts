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
}

const components: ComponentBaseline[] = [
  {
    component: 'evk',
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

describe('chain report: correctness', () => {
  it('attributes the EVault modules only to the pin that carries eVaultImplementation', () => {
    const r = report()
    const heading = (pin: string) => r.split('\n').find((l) => l.startsWith('#### ') && l.includes(`component-evk-${pin.slice(0, 8)}`))!
    expect(heading(PIN_IMPL)).toContain('the 8 EVault modules')
    expect(heading(PIN_CORE)).not.toContain('EVault modules')
  })

  it('renders one heading per component and one anchor per deployed pin', () => {
    const r = report()
    expect(r.match(/id="component-evk"/g)).toHaveLength(1)
    expect(r).toContain(`id="component-evk-${PIN_CORE.slice(0, 8)}"`)
    expect(r).toContain(`id="component-evk-${PIN_IMPL.slice(0, 8)}"`)
  })

  it('labels each contract with its own change, not the whole pin', () => {
    const rowOf = (key: string) => report().split('\n').find((l) => l.startsWith(`| [${key}]`))!
    expect(rowOf('protocolConfig')).toContain('default fee share 10% → 50%')
    expect(rowOf('eVaultFactory')).toContain('≡ baseline (this contract)')
    expect(rowOf('eVaultFactory')).not.toContain('visibility + fee')
  })

  it('keeps the final context line of an embedded diff', () => {
    expect(report()).toContain('+uint16 share = 0.5e4;\n }\n```')
  })

  it('diffs the lib the build compiled and names the override', () => {
    const r = report()
    expect(r).toContain('Built with submodule overrides')
    expect(r).toContain(`\`lib/ethereum-vault-connector\` @ \`${LIB_SIDE.slice(0, 8)}\` in place of \`${LIB_OLD.slice(0, 8)}\``)
    expect(r.split('\n').find((l) => l.startsWith('| [balanceTracker]'))).toContain('override')
  })

  it('prints a lib diff once per content, listing every contract that compiles it', () => {
    const r = report()
    expect(r.match(/if \(msg\.sig == ERC1271\) revert/g)).toHaveLength(1)
    expect(r).toContain('## Embedded libraries')
    expect(r).toContain(`balanceTracker (\`${LIB_SIDE.slice(0, 8)}\`, override)`)
    expect(r).toContain(`eVaultImplementation (\`${LIB_OLD.slice(0, 8)}\`)`)
  })

  it('says when the compiled lib equals what the component baseline compiled', () => {
    expect(report()).toContain("same EVCUtil as the component's audited baseline compiled")
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

  it('shows the proxy users hold and the implementation it proves', () => {
    const row = report().split('\n').find((l) => l.startsWith('| [balanceTracker]'))!
    expect(row).toContain('0x00000000…')
    expect(row).toContain('proxy')
    expect(row).toContain('impl')
  })

  it('labels maintainers notes as not an audit finding', () => {
    const r = report()
    expect(r).toContain('**Euler note**')
    expect(r).toContain('not an audit finding')
    expect(r).not.toContain('**Assessment**')
  })

  it('links the audits a pin note cites', () => {
    expect(report()).toContain('[Electisec (`audit-x`)](https://example.com/x.pdf)')
  })

  it('prints the baseline confidence as its own field', () => {
    expect(report()).toContain('Baseline confidence: **medium**')
  })

  it('names the engine commit and every input in the footer', () => {
    const r = report()
    expect(r).toContain(`https://github.com/euler-xyz/euler-verifier/tree/${ENGINE}`)
    expect(r).toContain('manifests/attention-notes.json')
    expect(r).toContain('https://github.com/euler-xyz/euler-verifier#readme')
  })
})

describe('chain report: embedded libs per contract', () => {
  it('marks a lib only on contracts that compile it, with its counts', () => {
    const r = report({
      pairs: inputs().pairs.map((p) => (p.pin === PIN_CORE ? { ...p, libComponents: [lib({})] } : p)),
    })
    const rowOf = (key: string) => r.split('\n').find((l) => l.startsWith(`| [${key}]`))!
    expect(rowOf('eVaultImplementation')).toContain('EVCUtil predates its audit (lacks +24/−9)')
    expect(rowOf('protocolConfig')).not.toContain('EVCUtil')
    expect(r).not.toContain('protocolConfig (`')
  })
})

describe('chain report: readability', () => {
  it('never leaves two blank lines in a row', () => {
    expect(report()).not.toContain('\n\n\n')
  })

  it('folds long diffs', () => {
    expect(report()).toMatch(/<details><summary>[^<]*60 lines[^<]*<\/summary>\n\n```diff\n line 0/)
  })

  it('links each contract row to its component section', () => {
    expect(report()).toContain('| [protocolConfig](#component-evk) |')
  })

  it('explains its terms', () => {
    expect(report()).toContain('How to read this report')
  })
})

describe('chain report: attention, counts and edge cases', () => {
  const base = inputs()
  const withEntry = (key: string, entry: ManifestEntry) => ({ '1': { ...base.manifest['1'], [key]: entry } })

  it('gives each build of one pin on a chain its own anchor', () => {
    const r = report({
      manifest: withEntry('protocolConfig', { repo: 'euler-xyz/euler-vault-kit', commit: PIN_CORE, evidence: { submoduleOverrides: [{ path: 'lib/x', ref: sha('3') }] } }),
      pairs: [
        ...base.pairs.map((p) => (p.pin === PIN_CORE ? { ...p, keys: ['eVaultFactory'] } : p)),
        pair({ keys: ['protocolConfig'], variant: 'abcd1234', overrides: [{ path: 'lib/x', ref: sha('3'), gitlink: sha('4') }] }),
      ],
    })
    expect(r.match(/id="component-evk-bbbbbbbb"/g)).toHaveLength(1)
    expect(r.match(/id="component-evk-bbbbbbbb-abcd1234"/g)).toHaveLength(1)
  })

  it('says when the commit an override replaces could not be resolved', () => {
    const r = report({ pairs: base.pairs.map((p) => (p.component === 'reward-streams' ? { ...p, overrides: [{ ...p.overrides[0]!, gitlink: null }] } : p)) })
    expect(r).toContain('could not be resolved')
    expect(r).not.toContain('in place of `—`')
  })

  it('leads with unproven, waived and delegated failures, counted once each', () => {
    const r = report({
      outcomes: base.outcomes.map((o) => (o.key === 'protocolConfig' ? { ...o, status: 'MISMATCH', matched: undefined } : o.key === 'balanceTracker' ? { ...o, status: 'WAIVED', matched: undefined } : o)),
      manifest: withEntry('balanceTracker', { ...base.manifest['1']!.balanceTracker!, waiver: { reason: 'size-fit variant', signed_by: 'ops' } }),
      modules: { '1': { modules: [{ module: 'Governance', address: '0x0000000000000000000000000000000000000009', verdict: 'MISMATCH', crossCheckedInImplementation: true }] } },
    })
    expect(r).toContain('## ⚠️ Requires attention')
    expect(r).toContain('**protocolConfig** — bytecode NOT proven (`MISMATCH`)')
    expect(r).toContain('**balanceTracker** — waived: size-fit variant')
    expect(r).toContain('**EVault module Governance** — FAILED')
    expect(r).toContain('Waived: 1 · Not proven: **1**')
    expect(r).toContain('| balanceTracker |')
  })

  it('counts a canonical entry once even when it also carries a waiver', () => {
    const r = report({
      outcomes: [...base.outcomes, { chainId: 1, key: 'EUL', address: '0x00000000000000000000000000000000000000EE', status: 'CANONICAL' }],
      manifest: withEntry('EUL', { repo: 'euler-xyz/euler-governance', verified: 'canonical', note: 'Canonical note.', waiver: { reason: 'x', signed_by: 'y' } }),
    })
    expect(r).toContain('Canonical (documented, not re-proven): 1')
    expect(r).not.toContain('Waived')
    expect(r).not.toContain('Not proven')
    expect(r).toContain('<a id="canonical-contracts"></a>Canonical contracts')
    expect(r).toContain('| [EUL](#canonical-contracts) |')
  })

  it('shows a flagged note once, above the table, linked to its pin', () => {
    const r = report({ notes: { all: { eVaultImplementation: { assessment: 'Flagged fact.', flag: true } } } })
    expect(r).toContain('**eVaultImplementation** — post-audit functionality change ([diff below](#component-evk-aaaaaaaa))')
    expect(r.match(/Flagged fact\./g)).toHaveLength(1)
  })

  it('explains a pin that predates its baseline with its own audited anchor', () => {
    const r = report({
      pairs: base.pairs.map((p) =>
        p.pin === PIN_IMPL ? { ...p, predatesBaseline: true, relation: 'predates-baseline', pinNote: { naturalBaseline: { auditId: 'audit-x', justification: 'Older audited state.' } } } : p,
      ),
    })
    expect(r).toContain('This deployment predates the component baseline.')
    expect(r).toContain('[Electisec (`audit-x`)](https://example.com/x.pdf): Older audited state.')
  })

  it('says so when every other address is a multisig', () => {
    expect(report({ uncovered: { '1': [] } })).toContain('Every other non-zero address in the euler-interfaces address files is a multisig Safe.')
  })

  it('treats an empty source list as unknown, not as compiling nothing', () => {
    const r = report({ outcomes: base.outcomes.map((o) => (o.key === 'eVaultImplementation' ? { ...o, matched: { ...o.matched!, sources: [] } } : o)) })
    expect(r.split('\n').find((l) => l.startsWith('| [eVaultImplementation]'))).toContain('EVCUtil predates its audit')
  })

  it('escapes a pipe in a label', () => {
    const r = report({ pairs: base.pairs.map((p) => (p.pin === PIN_IMPL ? { ...p, pinNote: { label: 'a | b' } } : p)) })
    expect(r.split('\n').find((l) => l.startsWith('| [eVaultImplementation]'))).toContain('a \\| b')
  })

  it('gives long diffs a reproduce command and a direct GitHub compare', () => {
    const r = report({
      pairs: base.pairs.map((p) => (p.pin === PIN_IMPL ? { ...p, diffEmbeddable: false, libComponents: [lib({ diffEmbeddable: false, contentKey: 'long-variant' })] } : p)),
    })
    expect(r).toContain(`/compare/${BASE}..${PIN_IMPL})`)
    expect(r).toContain(`Reproduce: \`git diff ${LIB_OLD.slice(0, 12)} ${LIB_BASE.slice(0, 12)} -- src/utils/EVCUtil.sol\``)
  })
})
