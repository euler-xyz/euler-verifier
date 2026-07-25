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

// CBOR encodings inside solc metadata blobs:
//   64 'ipfs'  58 22 12 20 <32-byte digest>   (ipfs multihash)
//   65 'bzzr0' 58 20       <32-byte digest>   (legacy swarm)
//   65 'bzzr1' 58 20       <32-byte digest>
const EMBEDDED_DIGEST_MARKERS: Array<{ marker: number[]; digestLen: number }> = [
  { marker: [0x64, 0x69, 0x70, 0x66, 0x73, 0x58, 0x22, 0x12, 0x20], digestLen: 32 },
  { marker: [0x65, 0x62, 0x7a, 0x7a, 0x72, 0x30, 0x58, 0x20], digestLen: 32 },
  { marker: [0x65, 0x62, 0x7a, 0x7a, 0x72, 0x31, 0x58, 0x20], digestLen: 32 },
]

/**
 * Factories embed CHILD creation bytecode (e.g. GenericFactory embeds
 * BeaconProxy, IRM factories embed their IRMs) and that embedded code carries
 * its own metadata digest, which varies with source *paths* even when the
 * code is identical. Stripping the outer trailer cannot reach these. Zero
 * every embedded metadata DIGEST (the 32 hash bytes only — the embedded
 * child code itself remains fully compared).
 */
export function maskEmbeddedMetadataDigests(code: Uint8Array): { masked: Uint8Array; count: number } {
  const out = new Uint8Array(code)
  let count = 0
  for (const { marker, digestLen } of EMBEDDED_DIGEST_MARKERS) {
    outer: for (let i = 0; i + marker.length + digestLen <= out.length; i++) {
      for (let j = 0; j < marker.length; j++) {
        if (code[i + j] !== marker[j]) continue outer
      }
      out.fill(0, i + marker.length, i + marker.length + digestLen)
      count++
      i += marker.length + digestLen - 1
    }
  }
  return { masked: out, count }
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

  // Mask within the stripped runtime, retaining strict range bounds; then
  // zero embedded child-metadata digests (factories embed child creation
  // code whose metadata varies with source paths).
  const chainEmbedded = maskEmbeddedMetadataDigests(maskRanges(chainSplit.runtime, ranges))
  const artifactEmbedded = maskEmbeddedMetadataDigests(maskRanges(artifactSplit.runtime, ranges))
  const chainStripped = chainEmbedded.masked
  const artifactStripped = artifactEmbedded.masked
  base.embeddedDigestsMasked = [chainEmbedded.count, artifactEmbedded.count]

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
