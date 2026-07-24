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

  // Mask within the stripped runtime, retaining strict range bounds.
  const chainStripped = maskRanges(chainSplit.runtime, ranges)
  const artifactStripped = maskRanges(artifactSplit.runtime, ranges)

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
