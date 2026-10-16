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

/** A compiled contract and the contracts whose code it embeds, as the compiler reports them. */
export interface CompiledContract {
  creation?: Uint8Array
  runtime?: Uint8Array
  embeds: CompiledContract[]
}

/** Where `needle` occurs in `haystack`, or null unless it occurs exactly once. */
function onlyOccurrence(haystack: Uint8Array | undefined, needle: Uint8Array | undefined): number | null {
  if (!haystack || !needle || needle.length === 0 || needle.length >= haystack.length) return null
  const h = Buffer.from(haystack.buffer, haystack.byteOffset, haystack.length)
  const n = Buffer.from(needle.buffer, needle.byteOffset, needle.length)
  const at = h.indexOf(n)
  return at !== -1 && h.indexOf(n, at + 1) === -1 ? at : null
}

const shift = (ranges: ImmutableRange[], by: number | null): ImmutableRange[] =>
  by === null ? [] : ranges.map((r) => ({ start: r.start + by, length: r.length }))

type Memo = Map<CompiledContract, ImmutableRange[]>

/** Digest ranges in `contract.creation`: its runtime's trailer and those of each child placed in it, recursively. */
function creationDigests(contract: CompiledContract, memo: Memo): ImmutableRange[] {
  const cached = memo.get(contract)
  if (cached) return cached
  const { creation, runtime } = contract
  const ranges = creation
    ? [
        ...shift(runtime ? trailerDigestRanges(runtime) : [], onlyOccurrence(creation, runtime)),
        ...contract.embeds.flatMap((child) => [
          ...shift(creationDigests(child, memo), onlyOccurrence(creation, child.creation)),
          ...shift(runtimeDigests(child, memo), onlyOccurrence(creation, child.runtime)),
        ]),
      ]
    : []
  memo.set(contract, ranges)
  return ranges
}

/** The digest ranges of `contract.creation` that fall in its runtime, as runtime offsets. */
function runtimeDigests(contract: CompiledContract, memo: Memo): ImmutableRange[] {
  const at = onlyOccurrence(contract.creation, contract.runtime)
  if (at === null) return []
  const end = at + contract.runtime!.length
  return shift(
    creationDigests(contract, memo).filter((r) => r.start >= at && r.start + r.length <= end),
    -at,
  )
}

/**
 * Factories embed CHILD code (e.g. GenericFactory embeds BeaconProxy), and the
 * embedded code carries its own metadata digest, which varies with source
 * *paths* even when the code is identical. Stripping the outer trailer cannot
 * reach these.
 *
 * A digest is masked only where the compiler placed a child: a contract that
 * `contract.embeds` lists, whose code occurs exactly once in the creation code
 * of the contract embedding it. A creation code holds the constructor's
 * children and the runtime alike, so any second copy (a constant equal to the
 * child's code, or the child embedded by both) leaves the child unmasked.
 * Returns ranges of `contract.runtime`, its own trailer excluded.
 */
export function embeddedMetadataRanges(contract: CompiledContract): ImmutableRange[] {
  if (!contract.runtime) return []
  const executable = splitMetadata(contract.runtime).runtime.length
  const ranges = runtimeDigests(contract, new Map()).filter((r) => r.start + r.length <= executable)
  const unique = new Map(ranges.map((r) => [`${r.start}:${r.length}`, r]))
  return [...unique.values()].sort((a, b) => a.start - b.start)
}

/**
 * The `ranges` of `code` with any byte different in `variant`, the same
 * contract built with only its metadata settings changed. A digest the
 * compiler placed changes; bytes that only equal a child's code, such as a
 * constant, do not, so they are never masked.
 */
export function rangesChangedByMetadata(code: Uint8Array, variant: Uint8Array | undefined, ranges: ImmutableRange[]): ImmutableRange[] {
  if (!variant || variant.length !== code.length) return []
  return ranges.filter((r) => code.subarray(r.start, r.start + r.length).some((byte, i) => byte !== variant[r.start + i]))
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
