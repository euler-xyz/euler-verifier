import type { CborInfo } from './types.js'

/**
 * Solidity appends a CBOR-encoded metadata blob to runtime bytecode; the last
 * two bytes are the big-endian length of that blob (excluding the two length
 * bytes themselves).
 *
 * The length words alone MUST NOT be trusted: arbitrary executable bytes
 * would otherwise be discarded as "metadata", letting two different
 * executables reduce to the same runtime. The claimed trailer is stripped
 * only if it decodes COMPLETELY as the Solidity metadata shape — a
 * definite-length CBOR map with known text keys and well-formed values,
 * consuming exactly the claimed length. Anything else fails closed: the full
 * input is retained as runtime.
 */
export function splitMetadata(code: Uint8Array): { runtime: Uint8Array; cbor: Uint8Array | null } {
  if (code.length < 2) return { runtime: code, cbor: null }

  const b0 = code[code.length - 2]
  const b1 = code[code.length - 1]
  if (b0 === undefined || b1 === undefined) return { runtime: code, cbor: null }

  const cborLen = (b0 << 8) | b1
  if (cborLen === 0 || cborLen + 2 > code.length) return { runtime: code, cbor: null }

  const cbor = code.subarray(code.length - (cborLen + 2), code.length - 2)
  if (!isSolidityMetadataCbor(cbor)) return { runtime: code, cbor: null }

  return { runtime: code.subarray(0, code.length - (cborLen + 2)), cbor }
}

const KNOWN_METADATA_KEYS = new Set(['ipfs', 'bzzr0', 'bzzr1', 'solc', 'experimental'])

/**
 * Strict validator for the CBOR subset solc emits: one definite-length map,
 * text-string keys from the known set, byte-string/bool values, consuming the
 * buffer exactly.
 */
export function isSolidityMetadataCbor(cbor: Uint8Array): boolean {
  if (cbor.length < 1) return false
  const head = cbor[0]!
  // Definite-length map with 1..23 entries (0xa1..0xb7); solc emits 1-3.
  if (head < 0xa1 || head > 0xb7) return false
  const entries = head - 0xa0
  let i = 1

  const readTextKey = (): string | null => {
    const h = cbor[i]
    if (h === undefined || h < 0x60 || h > 0x77) return null // definite text, len 0..23
    const len = h - 0x60
    if (i + 1 + len > cbor.length) return null
    const key = Buffer.from(cbor.subarray(i + 1, i + 1 + len)).toString('utf8')
    i += 1 + len
    return key
  }

  const skipValue = (): boolean => {
    const h = cbor[i]
    if (h === undefined) return false
    if (h >= 0x40 && h <= 0x57) {
      // byte string, short length
      const len = h - 0x40
      if (i + 1 + len > cbor.length) return false
      i += 1 + len
      return true
    }
    if (h === 0x58) {
      // byte string, one-byte length
      const len = cbor[i + 1]
      if (len === undefined || i + 2 + len > cbor.length) return false
      i += 2 + len
      return true
    }
    if (h === 0xf4 || h === 0xf5) {
      // bool (experimental flag)
      i += 1
      return true
    }
    return false
  }

  for (let e = 0; e < entries; e++) {
    const key = readTextKey()
    if (key === null || !KNOWN_METADATA_KEYS.has(key)) return false
    if (!skipValue()) return false
  }
  return i === cbor.length
}

/**
 * Minimal extraction of the fields we surface as evidence (full CBOR decoding
 * is unnecessary: the solidity blob is a one-level map with known keys).
 */
export function decodeCborInfo(cbor: Uint8Array | null): CborInfo {
  if (!cbor) return {}
  const info: CborInfo = {}

  const ipfsIdx = indexOfSeq(cbor, ascii('ipfs'))
  if (ipfsIdx !== -1) {
    const v = cbor.subarray(ipfsIdx + 4)
    // 0x58 <len> — CBOR byte string with one-byte length
    if (v.length >= 2 && v[0] === 0x58) {
      const len = v[1]!
      if (v.length >= 2 + len) info.ipfs = toHex(v.subarray(2, 2 + len))
    }
  }

  const solcIdx = indexOfSeq(cbor, ascii('solc'))
  if (solcIdx !== -1) {
    const v = cbor.subarray(solcIdx + 4)
    // 0x43 — CBOR byte string of length 3: major.minor.patch
    if (v.length >= 4 && v[0] === 0x43) {
      info.solcVersion = `${v[1]}.${v[2]}.${v[3]}`
    }
  }

  return info
}

function ascii(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function indexOfSeq(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) throw new Error(`odd-length hex string (${clean.length} chars)`)
  // Fail closed: Buffer.from(_, 'hex') silently stops at the first non-hex
  // byte, which would truncate Foundry artifacts containing unresolved
  // library link placeholders (__$...$__) into a valid-looking prefix.
  const bad = clean.search(/[^0-9a-fA-F]/)
  if (bad !== -1) {
    const isLinkPlaceholder = /__\$[0-9a-fA-F]{34}\$__|__[A-Za-z$]/.test(clean)
    throw new Error(
      `invalid hex at offset ${bad}${
        isLinkPlaceholder
          ? ' — bytecode contains unresolved library link placeholders; the build must resolve library addresses before comparison'
          : ''
      }`,
    )
  }
  return Uint8Array.from(Buffer.from(clean, 'hex'))
}
