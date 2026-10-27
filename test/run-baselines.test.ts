import { describe, expect, it } from 'vitest'
import { libDiffFile } from '../src/run-baselines.js'

describe('embedded lib diffs', () => {
  it('gives each lib of one component pin its own patch file', () => {
    const pin = 'fc359a04cc7b61f1a421d3a3baacca15a03fa9a6'
    const evc = libDiffFile('swapVerifier', pin, 'euler-xyz/ethereum-vault-connector')
    const earn = libDiffFile('swapVerifier', pin, 'euler-xyz/euler-earn')
    expect(evc).toBe('diff-swapVerifier-fc359a04-lib-ethereum-vault-connector.patch')
    expect(earn).not.toBe(evc)
  })
})
