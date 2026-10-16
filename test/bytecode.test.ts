import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectImmutableRanges, compareRuntime, embeddedMetadataRanges, maskRanges, rangesChangedByMetadata, sha256Hex } from '../src/bytecode.js'
import { compiledContract, indexBuild, readBuildIndex, type ForgeArtifact } from '../src/compiled-contracts.js'
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

// Compiled with solc 0.8.24 (forge 1.7.1 --ast, runs 200, cancun) from the same sources
// under two source paths (2026-10-16), ASTs trimmed to contract definitions; variantDeployedBytecode
// is the same build with FOUNDRY_USE_LITERAL_CONTENT=true:
// - Factory embeds Child's creation code; NestedFactory embeds Middle, which embeds Grandchild;
// - BytesConstant returns a constant shaped like an ipfs metadata entry (digest 0xaa.. or 0xbb..);
// - ChildLiteral returns a constant equal to Child's creation code of the same build;
// - ConstructorFactory embeds Child in its constructor and returns that same constant;
// - Flag lists Child as a dependency, but its `new Child()` is dead code: only the constant is placed.
const BUILDS = JSON.parse(readFileSync(join(FIXTURES, 'embedded', 'artifacts.json'), 'utf8')) as Record<
  string,
  { bytecode: string; deployedBytecode: string; variantDeployedBytecode: string; metadata: unknown; ast: ForgeArtifact['ast'] }
>
const artifact = (id: string): ForgeArtifact => ({
  bytecode: { object: BUILDS[id]!.bytecode },
  deployedBytecode: { object: BUILDS[id]!.deployedBytecode },
  metadata: BUILDS[id]!.metadata,
  ast: BUILDS[id]!.ast,
})
const runtime = (id: string) => fromHex(BUILDS[id]!.deployedBytecode)
const buildB = indexBuild(Object.keys(BUILDS).filter((id) => id.startsWith('b/')).map(artifact))
const locatedIn = (name: string) => embeddedMetadataRanges(compiledContract(buildB, artifact(`b/${name}`)))
const masksOf = (name: string) =>
  rangesChangedByMetadata(runtime(`b/${name}`), fromHex(BUILDS[`b/${name}`]!.variantDeployedBytecode), locatedIn(name))
const verdicts = (name: string) => ({
  masked: compareRuntime(runtime(`a/${name}`), runtime(`b/${name}`), {}, masksOf(name)).match,
  unmasked: compareRuntime(runtime(`a/${name}`), runtime(`b/${name}`), {}).match,
})

describe('embedded child metadata (factories embedding child code)', () => {
  it('masks the embedded child digest the compiler placed, so path-only differences MATCH', () => {
    expect(masksOf('Factory')).toHaveLength(1)
    expect(verdicts('Factory')).toEqual({ masked: true, unmasked: false })
    const { evidence } = compareRuntime(runtime('a/Factory'), runtime('b/Factory'), {}, masksOf('Factory'))
    expect(evidence.embeddedDigestsMasked).toEqual([1, 1])
  })

  it('masks the digests of children embedded by children', () => {
    expect(masksOf('NestedFactory')).toHaveLength(2)
    expect(verdicts('NestedFactory')).toEqual({ masked: true, unmasked: false })
  })

  it('never masks a metadata-shaped constant', () => {
    expect(masksOf('BytesConstant')).toEqual([])
    expect(verdicts('BytesConstant')).toEqual({ masked: false, unmasked: false })
  })

  it('never masks a constant equal to another contract of the build: different returned bytes MISMATCH', () => {
    const child = Buffer.from(fromHex(BUILDS['b/Child']!.bytecode))
    expect(Buffer.from(runtime('b/ChildLiteral')).includes(child)).toBe(true)
    expect(masksOf('ChildLiteral')).toEqual([])
    expect(verdicts('ChildLiteral')).toEqual({ masked: false, unmasked: false })
  })

  it('masks nothing the compiler did not place: a dependency compiled out leaves only a constant', () => {
    expect(locatedIn('Flag')).toHaveLength(1)
    expect(masksOf('Flag')).toEqual([])
    expect(verdicts('Flag')).toEqual({ masked: false, unmasked: false })
  })

  it('confirms a range only against a variant build of the same length', () => {
    const ranges = locatedIn('Factory')
    expect(rangesChangedByMetadata(runtime('b/Factory'), undefined, ranges)).toEqual([])
    expect(rangesChangedByMetadata(runtime('b/Factory'), runtime('b/Factory'), ranges)).toEqual([])
    expect(rangesChangedByMetadata(runtime('b/Factory'), runtime('b/Factory').subarray(1), ranges)).toEqual([])
  })

  it('leaves a child unmasked when its code occurs twice in the creation code', () => {
    expect(masksOf('ConstructorFactory')).toEqual([])
    expect(verdicts('ConstructorFactory')).toEqual({ masked: false, unmasked: false })
  })

  it('a semantic difference inside the embedded child code still MISMATCHes', () => {
    const tampered = runtime('a/Factory')
    const childAt = Buffer.from(tampered).indexOf(Buffer.from(fromHex(BUILDS['a/Child']!.bytecode)))
    tampered[childAt + 5] = tampered[childAt + 5]! ^ 0xff
    expect(compareRuntime(tampered, runtime('b/Factory'), {}, masksOf('Factory')).match).toBe(false)
  })

  it('masks nothing for a dependency two artifacts of one compiler run disagree on', () => {
    const builds = Object.keys(BUILDS).filter((id) => id.startsWith('b/')).map(artifact)
    const child = builds.find((a) => a.ast?.nodes?.some((n) => n.name === 'Child') && a.deployedBytecode?.object === BUILDS['b/Child']!.deployedBytecode)!
    const conflicting = { ...child, deployedBytecode: { object: BUILDS['b/Grandchild']!.deployedBytecode } }
    const contract = compiledContract(indexBuild([...builds, conflicting]), artifact('b/Factory'))
    expect(contract.embeds).toEqual([])
    expect(embeddedMetadataRanges(contract)).toEqual([])
  })

  it('masks nothing without an AST', () => {
    const bare = (id: string): ForgeArtifact => ({ ...artifact(id), ast: undefined })
    const index = indexBuild(Object.keys(BUILDS).filter((id) => id.startsWith('b/')).map(bare))
    expect(embeddedMetadataRanges(compiledContract(index, bare('b/Factory')))).toEqual([])
  })

  it('reads the index from a forge out/ directory, build-info excluded', () => {
    const out = mkdtempSync(join(tmpdir(), 'verifier-out-'))
    try {
      for (const name of ['Factory', 'Child']) {
        mkdirSync(join(out, 'Factory.sol'), { recursive: true })
        writeFileSync(join(out, 'Factory.sol', `${name}.json`), JSON.stringify(artifact(`b/${name}`)))
      }
      mkdirSync(join(out, 'build-info'))
      writeFileSync(join(out, 'build-info', 'x.json'), '{"id":"x"}')
      expect(embeddedMetadataRanges(compiledContract(readBuildIndex(out), artifact('b/Factory')))).toEqual(locatedIn('Factory'))
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  })
})

describe('sha256Hex', () => {
  it('is the standard sha256', () => {
    // sha256("") — canonical empty-input digest
    expect(sha256Hex(new Uint8Array())).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
