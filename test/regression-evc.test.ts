import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareRuntime } from '../src/bytecode.js'
import { fromHex } from '../src/metadata.js'
import type { ImmutableRange } from '../src/types.js'

/**
 * Network-free regression matrix, pinned to recorded reality (2026-07-24):
 * on-chain EVC runtime bytecode for three chains vs the deployedBytecode of
 * the two deployment commits, built with the evk-periphery profile
 * (solc 0.8.24, optimizer_runs 20000, evm cancun).
 *
 * mainnet (1)    -> ethereum-vault-connector @ 084b3228
 * base (8453)    -> ethereum-vault-connector @ a7d3c29e
 * arbitrum (42161) -> ethereum-vault-connector @ a7d3c29e
 *
 * Every off-diagonal pair MUST mismatch: that is the "wrong commit fails
 * loudly" guarantee.
 */

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

interface ArtifactFixture {
  contractName: string
  commit: string
  deployedBytecode: string
  immutableReferences: Record<string, ImmutableRange[]>
}

function chainCode(name: string): Uint8Array {
  return fromHex(readFileSync(join(FIXTURES, 'chaincode', name), 'utf8').trim())
}

function artifact(tag: string): ArtifactFixture {
  return JSON.parse(readFileSync(join(FIXTURES, 'artifacts', `evc-${tag}.json`), 'utf8')) as ArtifactFixture
}

const CHAINS = {
  1: chainCode('1-evc.hex'),
  8453: chainCode('8453-evc.hex'),
  42161: chainCode('42161-evc.hex'),
} as const

const ARTIFACTS = {
  '084b3228': artifact('084b3228'),
  a7d3c29e: artifact('a7d3c29e'),
} as const

const EXPECTED: Array<[keyof typeof CHAINS, keyof typeof ARTIFACTS, boolean]> = [
  [1, '084b3228', true],
  [8453, '084b3228', false],
  [42161, '084b3228', false],
  [1, 'a7d3c29e', false],
  [8453, 'a7d3c29e', true],
  [42161, 'a7d3c29e', true],
]

describe('EVC regression matrix (3 chains x 2 commits)', () => {
  for (const [chainId, tag, shouldMatch] of EXPECTED) {
    it(`chain ${chainId} vs ${tag}: ${shouldMatch ? 'MATCH' : 'MISMATCH'}`, () => {
      const a = ARTIFACTS[tag]
      const { match, evidence } = compareRuntime(CHAINS[chainId], fromHex(a.deployedBytecode), a.immutableReferences)
      expect(match).toBe(shouldMatch)
      if (shouldMatch) {
        expect(evidence.strippedChainSha256).toBe(evidence.strippedArtifactSha256)
        // Both EVC immutables (cached EIP-712 domain separator inputs) must be masked.
        expect(evidence.maskedRanges).toHaveLength(2)
        expect(evidence.maskedRanges.every((r) => r.length === 32)).toBe(true)
        expect(evidence.chainCbor?.solcVersion).toBe('0.8.24')
        expect(evidence.artifactCbor?.solcVersion).toBe('0.8.24')
      }
    })
  }

  it('base and arbitrum carry identical logic (same commit, different immutables/metadata)', () => {
    const a = ARTIFACTS['a7d3c29e']
    const base = compareRuntime(CHAINS[8453], fromHex(a.deployedBytecode), a.immutableReferences)
    const arb = compareRuntime(CHAINS[42161], fromHex(a.deployedBytecode), a.immutableReferences)
    expect(base.evidence.strippedChainSha256).toBe(arb.evidence.strippedChainSha256)
  })

  it('metadata alone never bridges a source difference: the two artifacts differ', () => {
    const a = ARTIFACTS['084b3228']
    const b = ARTIFACTS.a7d3c29e
    const { match, evidence } = compareRuntime(fromHex(a.deployedBytecode), fromHex(b.deployedBytecode), b.immutableReferences)
    expect(match).toBe(false)
    expect(evidence.chainCodeSize).not.toBe(evidence.artifactCodeSize)
  })
})
