import { describe, expect, it } from 'vitest'
import { embeddedAddressSet, MODULE_NAMES } from '../src/modules.js'

describe('embeddedAddressSet', () => {
  function codeWithWordAt(offset: number, addr20: number[], size = 128): Uint8Array {
    const code = new Uint8Array(size).fill(0x5b)
    code.fill(0, offset, offset + 12)
    code.set(addr20, offset + 12)
    return code
  }

  const ADDR = Array.from({ length: 20 }, (_, i) => i + 1)

  it('extracts checksummed addresses from 32-byte immutable words', () => {
    const code = codeWithWordAt(32, ADDR)
    const set = embeddedAddressSet(code, { '1': [{ start: 32, length: 32 }] })
    expect(set.size).toBe(1)
    expect([...set][0]!.toLowerCase()).toBe('0x0102030405060708090a0b0c0d0e0f1011121314')
  })

  it('ignores words with non-zero top bytes (not addresses)', () => {
    const code = new Uint8Array(64).fill(0xff)
    expect(embeddedAddressSet(code, { '1': [{ start: 16, length: 32 }] }).size).toBe(0)
  })

  it('ignores zero addresses and non-32-byte ranges', () => {
    const code = new Uint8Array(64).fill(0)
    expect(embeddedAddressSet(code, { '1': [{ start: 0, length: 32 }] }).size).toBe(0)
    expect(embeddedAddressSet(code, { '2': [{ start: 0, length: 20 }] }).size).toBe(0)
  })

  it('tolerates out-of-bounds ranges defensively', () => {
    const code = new Uint8Array(16)
    expect(embeddedAddressSet(code, { '1': [{ start: 8, length: 32 }] }).size).toBe(0)
  })
})

describe('module registry', () => {
  it('covers exactly the 8 Dispatch modules', () => {
    expect(MODULE_NAMES).toHaveLength(8)
    expect(new Set(MODULE_NAMES).size).toBe(8)
  })
})
