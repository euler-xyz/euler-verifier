import { createHash } from 'node:crypto'
import { splitMetadata, decodeCborInfo } from './metadata.js'
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

export interface CompareResult {
  match: boolean
  evidence: CompareEvidence
}

/**
 * The core verification comparison:
 * mask immutables in both, strip CBOR metadata from both, byte-compare.
 */
export function compareRuntime(
  chainCode: Uint8Array,
  artifactCode: Uint8Array,
  immutableReferences: Record<string, ImmutableRange[]> | undefined | null,
): CompareResult {
  const ranges = collectImmutableRanges(immutableReferences)

  const chainCbor = decodeCborInfo(splitMetadata(chainCode).cbor)
  const artifactCbor = decodeCborInfo(splitMetadata(artifactCode).cbor)

  const base: CompareEvidence = {
    chainCodeSize: chainCode.length,
    artifactCodeSize: artifactCode.length,
    maskedRanges: ranges,
    chainCbor,
    artifactCbor,
  }

  // Immutable offsets are only meaningful when the code shapes agree; a size
  // difference is already a definitive mismatch (different source or settings).
  if (chainCode.length !== artifactCode.length) {
    return { match: false, evidence: { ...base, firstDivergence: null } }
  }

  const chainStripped = splitMetadata(maskRanges(chainCode, ranges)).runtime
  const artifactStripped = splitMetadata(maskRanges(artifactCode, ranges)).runtime

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
