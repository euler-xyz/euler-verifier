import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { uncoveredKeys } from '../src/addresses.js'

const addr = (n: number) => `0x${n.toString(16).padStart(40, '0')}`

describe('contracts outside the verification scope', () => {
  it('lists non-zero address-file keys that have no manifest entry, multisigs excluded', () => {
    const root = mkdtempSync(join(tmpdir(), 'verifier-scope-'))
    const dir = join(root, 'addresses', '1')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'CoreAddresses.json'), JSON.stringify({ evc: addr(1), eulerEarnFactory: addr(0) }))
    writeFileSync(join(dir, 'LensAddresses.json'), JSON.stringify({ vaultLens: addr(2), accountLens: addr(3) }))
    writeFileSync(join(dir, 'MultisigAddresses.json'), JSON.stringify({ DAO: addr(4) }))
    expect(uncoveredKeys(join(root, 'addresses'), 1, new Set(['evc']))).toEqual(['accountLens', 'vaultLens'])
  })
})
