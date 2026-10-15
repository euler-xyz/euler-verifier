import { createHash } from 'node:crypto'
import { splitMetadata, decodeCborInfo, trailerDigestRanges } from './metadata.js'
import type { CompareEvidence, ImmutableRange } from './types.js'

/**
 * forge artifact `deployedBytecode.immutableReferences` shape:
 * { "<astId>": [ { "start": n, "length": m }, ... ], ... }
 */
export function collectImmutableRanges(refs: Record<string, ImmutableRange[]> | undefined | null): ImmutableRange[] {
  if (!refs) return []
  const ranges = Object.values(refs).flat()
  return [...ranges].sort((a, b) => a.start - b.start)
}

/** Returns a copy of `code` with every range zeroed. Throws on out-of-bounds ranges. */
export function maskRanges(code: Uint8Array, ranges: ImmutableRange[]): Uint8Array {
  const out = new Uint8Array(code)
  for (const { start, length } of ranges) {
    if (start < 0 || length < 0 || start + length > out.length) {
      throw new Error(`immutable range [${start}, +${length}] out of bounds for code of ${out.length} bytes`)
    }
    out.fill(0, start, start + length)
  }
  return out
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * Factories embed CHILD creation code (e.g. GenericFactory embeds
 * BeaconProxy), and the embedded code carries its own metadata digest, which
 * varies with source *paths* even when the code is identical. Stripping the
 * outer trailer cannot reach these.
 *
 * Locations come only from the build: every child code of the same build
 * (each artifact's creation and deployed bytecode) found verbatim in `code`
 * contributes the digests of its validated metadata trailer, recursively for
 * the children it embeds itself. A byte pattern that merely looks like
 * metadata (e.g. inside a bytes constant) is never masked.
 */
export function embeddedMetadataRanges(code: Uint8Array, childCodes: Uint8Array[]): ImmutableRange[] {
  const children = childCodes.filter((c) => trailerDigestRanges(c).length > 0)
  const memo = new Map<Uint8Array, ImmutableRange[]>()

  const within = (outer: Uint8Array): ImmutableRange[] => {
    const haystack = Buffer.from(outer.buffer, outer.byteOffset, outer.length)
    const found: ImmutableRange[] = []
    for (const child of children) {
      if (child.length >= outer.length) continue
      const needle = Buffer.from(child.buffer, child.byteOffset, child.length)
      for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
        for (const r of ownAndNested(child)) found.push({ start: at + r.start, length: r.length })
      }
    }
    return found
  }
  const ownAndNested = (child: Uint8Array): ImmutableRange[] => {
    const cached = memo.get(child)
    if (cached) return cached
    const ranges = [...trailerDigestRanges(child), ...within(child)]
    memo.set(child, ranges)
    return ranges
  }

  const unique = new Map(within(code).map((r) => [`${r.start}:${r.length}`, r]))
  return [...unique.values()].sort((a, b) => a.start - b.start)
}

export interface CompareResult {
  match: boolean
  evidence: CompareEvidence
}

/**
 * The core verification comparison: strip the validated CBOR trailer from
 * both, mask immutables and the given embedded metadata digests in both,
 * byte-compare.
 */
export function compareRuntime(
  chainCode: Uint8Array,
  artifactCode: Uint8Array,
  immutableReferences: Record<string, ImmutableRange[]> | undefined | null,
  embeddedMetadata: ImmutableRange[] = [],
): CompareResult {
  const ranges = collectImmutableRanges(immutableReferences)

  // Strip the CBOR trailer FIRST: identical executable runtimes may carry
  // different-length metadata (bytecode_hash settings, solc variations), and
  // comparing raw lengths before the strip would reject them falsely.
  const chainSplit = splitMetadata(chainCode)
  const artifactSplit = splitMetadata(artifactCode)

  const base: CompareEvidence = {
    chainCodeSize: chainCode.length,
    artifactCodeSize: artifactCode.length,
    chainRuntimeSize: chainSplit.runtime.length,
    artifactRuntimeSize: artifactSplit.runtime.length,
    maskedRanges: ranges,
    chainCbor: decodeCborInfo(chainSplit.cbor),
    artifactCbor: decodeCborInfo(artifactSplit.cbor),
  }

  // Immutable offsets are only meaningful when the executable shapes agree; a
  // stripped-runtime size difference is a definitive mismatch.
  if (chainSplit.runtime.length !== artifactSplit.runtime.length) {
    return { match: false, evidence: { ...base, firstDivergence: null } }
  }

  // Mask immutables and the artifact-derived embedded child-metadata digests
  // at the same offsets in both, retaining strict range bounds.
  const masks = [...ranges, ...embeddedMetadata]
  const chainStripped = maskRanges(chainSplit.runtime, masks)
  const artifactStripped = maskRanges(artifactSplit.runtime, masks)
  base.embeddedDigestsMasked = [embeddedMetadata.length, embeddedMetadata.length]

  const chainSha = sha256Hex(chainStripped)
  const artifactSha = sha256Hex(artifactStripped)

  const evidence: CompareEvidence = {
    ...base,
    strippedChainSha256: chainSha,
    strippedArtifactSha256: artifactSha,
  }

  if (chainSha === artifactSha) return { match: true, evidence }

  let firstDivergence: number | null = null
  const n = Math.min(chainStripped.length, artifactStripped.length)
  for (let i = 0; i < n; i++) {
    if (chainStripped[i] !== artifactStripped[i]) {
      firstDivergence = i
      break
    }
  }
  if (firstDivergence === null && chainStripped.length !== artifactStripped.length) firstDivergence = n

  return { match: false, evidence: { ...evidence, firstDivergence } }
}
