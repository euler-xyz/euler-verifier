import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodeCborInfo, fromHex, splitMetadata, toHex } from '../src/metadata.js'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function synthetic(runtime: number[], cbor: number[]): Uint8Array {
  const len = cbor.length
  return Uint8Array.from([...runtime, ...cbor, (len >> 8) & 0xff, len & 0xff])
}

describe('splitMetadata', () => {
  it('splits a synthetic runtime + valid solc CBOR trailer', () => {
    const code = synthetic([0xde, 0xad, 0xbe, 0xef], [0xa1, 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, 0x00, 0x08, 0x18])
    const { runtime, cbor } = splitMetadata(code)
    expect(toHex(runtime)).toBe('deadbeef')
    expect(cbor).not.toBeNull()
    expect(cbor!.length).toBe(10)
  })

  it('returns whole input when the trailer length is implausible', () => {
    // Claims 0xffff-byte CBOR in a 4-byte blob.
    const code = Uint8Array.from([0x60, 0x60, 0xff, 0xff])
    const { runtime, cbor } = splitMetadata(code)
    expect(runtime).toEqual(code)
    expect(cbor).toBeNull()
  })

  it('handles empty and tiny inputs', () => {
    expect(splitMetadata(new Uint8Array()).cbor).toBeNull()
    expect(splitMetadata(Uint8Array.from([0x00])).cbor).toBeNull()
    expect(splitMetadata(Uint8Array.from([0x00, 0x00])).cbor).toBeNull()
  })

  it('extracts solc version and ipfs hash from real EVC bytecode', () => {
    const code = fromHex(readFileSync(join(FIXTURES, 'chaincode', '1-evc.hex'), 'utf8').trim())
    const { runtime, cbor } = splitMetadata(code)
    expect(runtime.length).toBeLessThan(code.length)
    const info = decodeCborInfo(cbor)
    expect(info.solcVersion).toBe('0.8.24')
    // ipfs multihash: 0x1220 + 32 bytes
    expect(info.ipfs).toMatch(/^1220[0-9a-f]{64}$/)
  })
})

describe('hex helpers', () => {
  it('round-trips with and without 0x prefix', () => {
    expect(toHex(fromHex('0xdeadbeef'))).toBe('deadbeef')
    expect(toHex(fromHex('deadbeef'))).toBe('deadbeef')
  })

  it('rejects odd-length input', () => {
    expect(() => fromHex('0xabc')).toThrow(/odd-length/)
  })
})
