import type { CborInfo } from './types.js'

/**
 * Solidity appends a CBOR-encoded metadata blob to runtime bytecode; the last
 * two bytes are the big-endian length of that blob (excluding the two length
 * bytes themselves).
 */
export function splitMetadata(code: Uint8Array): { runtime: Uint8Array; cbor: Uint8Array | null } {
  if (code.length < 2) return { runtime: code, cbor: null }

  const b0 = code[code.length - 2]
  const b1 = code[code.length - 1]
  if (b0 === undefined || b1 === undefined) return { runtime: code, cbor: null }

  const cborLen = (b0 << 8) | b1
  if (cborLen === 0 || cborLen + 2 > code.length) return { runtime: code, cbor: null }

  return {
    runtime: code.subarray(0, code.length - (cborLen + 2)),
    cbor: code.subarray(code.length - (cborLen + 2), code.length - 2),
  }
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
  return Uint8Array.from(Buffer.from(clean, 'hex'))
}
