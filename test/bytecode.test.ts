import { describe, expect, it } from 'vitest'
import { collectImmutableRanges, compareRuntime, maskRanges, sha256Hex } from '../src/bytecode.js'

function withTrailer(runtime: number[], cborByte: number): Uint8Array {
  // 3-byte fake CBOR blob + 2-byte length.
  return Uint8Array.from([...runtime, cborByte, cborByte, cborByte, 0x00, 0x03])
}

describe('maskRanges', () => {
  it('zeroes the given ranges without mutating the input', () => {
    const code = Uint8Array.from([1, 2, 3, 4, 5])
    const masked = maskRanges(code, [{ start: 1, length: 2 }])
    expect([...masked]).toEqual([1, 0, 0, 4, 5])
    expect([...code]).toEqual([1, 2, 3, 4, 5])
  })

  it('throws on out-of-bounds ranges', () => {
    expect(() => maskRanges(Uint8Array.from([1, 2]), [{ start: 1, length: 5 }])).toThrow(/out of bounds/)
  })
})

describe('collectImmutableRanges', () => {
  it('flattens and sorts the forge artifact shape', () => {
    const ranges = collectImmutableRanges({
      '200': [{ start: 90, length: 32 }],
      '100': [
        { start: 50, length: 32 },
        { start: 10, length: 32 },
      ],
    })
    expect(ranges.map((r) => r.start)).toEqual([10, 50, 90])
  })

  it('tolerates missing refs', () => {
    expect(collectImmutableRanges(undefined)).toEqual([])
    expect(collectImmutableRanges(null)).toEqual([])
  })
})

describe('compareRuntime', () => {
  const runtime = [0x60, 0x80, 0x60, 0x40, 0x52, 0xaa, 0xbb, 0xcc]

  it('matches identical code', () => {
    const a = withTrailer(runtime, 0x11)
    const { match, evidence } = compareRuntime(a, Uint8Array.from(a), {})
    expect(match).toBe(true)
    expect(evidence.strippedChainSha256).toBe(evidence.strippedArtifactSha256)
  })

  it('matches when only metadata differs', () => {
    const { match } = compareRuntime(withTrailer(runtime, 0x11), withTrailer(runtime, 0x22), {})
    expect(match).toBe(true)
  })

  it('matches when only immutable regions differ, given the refs', () => {
    const chain = [...runtime]
    chain[5] = 0xde // pretend byte 5-6 is an immutable filled at deploy time
    chain[6] = 0xad
    const refs = { '1': [{ start: 5, length: 2 }] }
    const { match } = compareRuntime(withTrailer(chain, 0x11), withTrailer(runtime, 0x11), refs)
    expect(match).toBe(true)
  })

  it('mismatches when immutable regions differ WITHOUT refs (masking is load-bearing)', () => {
    const chain = [...runtime]
    chain[5] = 0xde
    const { match, evidence } = compareRuntime(withTrailer(chain, 0x11), withTrailer(runtime, 0x11), {})
    expect(match).toBe(false)
    expect(evidence.firstDivergence).toBe(5)
  })

  it('mismatches immediately on size difference', () => {
    const { match, evidence } = compareRuntime(withTrailer(runtime, 0x11), withTrailer([...runtime, 0x00], 0x11), {})
    expect(match).toBe(false)
    expect(evidence.firstDivergence).toBeNull()
    expect(evidence.chainCodeSize).not.toBe(evidence.artifactCodeSize)
  })
})

describe('sha256Hex', () => {
  it('is the standard sha256', () => {
    // sha256("") — canonical empty-input digest
    expect(sha256Hex(new Uint8Array())).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
