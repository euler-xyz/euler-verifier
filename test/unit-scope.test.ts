import { describe, expect, it } from 'vitest'
import { numstatPathSides, parseNumstat, unitScopedDelta } from '../src/unit-scope.js'

describe('numstatPathSides', () => {
  it('returns a plain path unchanged', () => {
    expect(numstatPathSides('src/ProtocolConfig/ProtocolConfig.sol')).toEqual(['src/ProtocolConfig/ProtocolConfig.sol'])
  })

  it('expands braced renames to both sides', () => {
    expect(numstatPathSides('src/{OracleFactory => EulerRouterFactory}/EulerRouterFactory.sol')).toEqual([
      'src/OracleFactory/EulerRouterFactory.sol',
      'src/EulerRouterFactory/EulerRouterFactory.sol',
    ])
  })

  it('expands whole-path renames', () => {
    expect(numstatPathSides('src/Old.sol => src/New.sol')).toEqual(['src/Old.sol', 'src/New.sol'])
  })

  it('collapses the doubled slash of an empty rename side', () => {
    expect(numstatPathSides('src/{ => sub}/File.sol')).toEqual(['src/File.sol', 'src/sub/File.sol'])
  })
})

describe('parseNumstat', () => {
  it('parses per-file insertion/deletion counts', () => {
    expect(parseNumstat('1\t7\tsrc/EVault/modules/Governance.sol\n1\t1\tsrc/ProtocolConfig/ProtocolConfig.sol')).toEqual([
      { insertions: 1, deletions: 7, paths: ['src/EVault/modules/Governance.sol'] },
      { insertions: 1, deletions: 1, paths: ['src/ProtocolConfig/ProtocolConfig.sol'] },
    ])
  })

  it('treats binary-file dashes as zero counts', () => {
    expect(parseNumstat('-\t-\tsrc/blob.bin')).toEqual([{ insertions: 0, deletions: 0, paths: ['src/blob.bin'] }])
  })
})

describe('unitScopedDelta', () => {
  const pair = (numstat: string, over: Partial<Parameters<typeof unitScopedDelta>[0]> = {}) => {
    const lines = parseNumstat(numstat)
    return {
      files: lines.length,
      insertions: lines.reduce((sum, l) => sum + l.insertions, 0),
      deletions: lines.reduce((sum, l) => sum + l.deletions, 0),
      numstat,
      predatesBaseline: false,
      ...over,
    }
  }

  it('reports an empty unit delta when no changed file is in the compilation unit', () => {
    const p = pair('1\t1\tsrc/ProtocolConfig/ProtocolConfig.sol')
    const sources = ['src/SequenceRegistry/SequenceRegistry.sol', 'src/interfaces/ISequenceRegistry.sol']
    expect(unitScopedDelta(p, sources)).toEqual({ files: 0, insertions: 0, deletions: 0 })
  })

  it('recomputes counts from the intersecting files only', () => {
    const p = pair('1\t7\tsrc/EVault/modules/Governance.sol\n1\t1\tsrc/ProtocolConfig/ProtocolConfig.sol')
    expect(unitScopedDelta(p, ['src/EVault/modules/Governance.sol'])).toEqual({
      files: 1,
      insertions: 1,
      deletions: 7,
    })
  })

  it('matches either side of a rename', () => {
    const p = pair('10\t1\tsrc/{OracleFactory => EulerRouterFactory}/Factory.sol\n2\t2\tsrc/Other.sol')
    expect(unitScopedDelta(p, ['src/EulerRouterFactory/Factory.sol'])).toEqual({
      files: 1,
      insertions: 10,
      deletions: 1,
    })
  })

  it('returns null when the whole diff lies inside the unit', () => {
    const p = pair('1\t1\tsrc/A.sol')
    expect(unitScopedDelta(p, ['src/A.sol', 'src/B.sol'])).toBeNull()
  })

  it('returns null for empty diffs, missing source lists, and predates pairs', () => {
    expect(unitScopedDelta(pair(''), ['src/A.sol'])).toBeNull()
    expect(unitScopedDelta(pair('1\t1\tsrc/A.sol'), undefined)).toBeNull()
    expect(unitScopedDelta(pair('1\t1\tsrc/A.sol'), [])).toBeNull()
    expect(unitScopedDelta(pair('1\t1\tsrc/B.sol', { predatesBaseline: true }), ['src/A.sol'])).toBeNull()
  })
})
