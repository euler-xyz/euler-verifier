import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectImmutableRanges, compareRuntime, embeddedMetadataRanges, maskRanges, sha256Hex } from '../src/bytecode.js'
import { fromHex } from '../src/metadata.js'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function withTrailer(runtime: number[], versionByte: number): Uint8Array {
  // Valid solidity-shaped trailer: map1{ "solc": bytes3(v,v,v) } + 2-byte length.
  const cbor = [0xa1, 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, versionByte, versionByte, versionByte]
  return Uint8Array.from([...runtime, ...cbor, 0x00, cbor.length])
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

// Compiled with solc 0.8.24 (forge 1.7.1, runs 200, cancun) from the same sources
// under two source paths (2026-10-15): Factory embeds Child's creation code, and
// BytesConstant returns a constant shaped like an ipfs metadata entry, with
// 0xaa.. or 0xbb.. as the "digest".
const BUILDS = JSON.parse(readFileSync(join(FIXTURES, 'embedded', 'artifacts.json'), 'utf8')) as Record<
  string,
  { bytecode: string; deployedBytecode: string }
>
const runtime = (id: string) => fromHex(BUILDS[id]!.deployedBytecode)
const buildCodes = (v: 'a' | 'b') =>
  Object.entries(BUILDS)
    .filter(([id]) => id.startsWith(`${v}/`))
    .flatMap(([, a]) => [fromHex(a.bytecode), fromHex(a.deployedBytecode)])

describe('embedded child metadata (factories embedding child creation code)', () => {
  it('masks the embedded child digest at the offsets the build derives, so path-only differences MATCH', () => {
    const ranges = embeddedMetadataRanges(runtime('b/Factory'), buildCodes('b'))
    expect(ranges).toHaveLength(1)
    const { match, evidence } = compareRuntime(runtime('a/Factory'), runtime('b/Factory'), {}, ranges)
    expect(match).toBe(true)
    expect(evidence.embeddedDigestsMasked).toEqual([1, 1])
  })

  it('never masks a metadata-shaped constant: different returned bytes MISMATCH', () => {
    const ranges = embeddedMetadataRanges(runtime('b/BytesConstant'), buildCodes('b'))
    expect(ranges).toEqual([])
    expect(compareRuntime(runtime('a/BytesConstant'), runtime('b/BytesConstant'), {}, ranges).match).toBe(false)
    expect(compareRuntime(runtime('a/BytesConstant'), runtime('b/BytesConstant'), {}).match).toBe(false)
  })

  it('a semantic difference inside the embedded child code still MISMATCHes', () => {
    const ranges = embeddedMetadataRanges(runtime('b/Factory'), buildCodes('b'))
    const tampered = runtime('a/Factory')
    const childAt = Buffer.from(tampered).indexOf(Buffer.from(fromHex(BUILDS['a/Child']!.bytecode)))
    tampered[childAt + 5] = tampered[childAt + 5]! ^ 0xff
    expect(compareRuntime(tampered, runtime('b/Factory'), {}, ranges).match).toBe(false)
  })

  it('ignores candidate codes without a valid metadata trailer', () => {
    const bare = fromHex('0x6080604052348015600e575f80fd5b50')
    expect(embeddedMetadataRanges(Uint8Array.from([...bare, ...bare]), [bare])).toEqual([])
  })
})

describe('sha256Hex', () => {
  it('is the standard sha256', () => {
    // sha256("") — canonical empty-input digest
    expect(sha256Hex(new Uint8Array())).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
