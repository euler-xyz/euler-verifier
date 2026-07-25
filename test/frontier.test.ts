import { describe, expect, it } from 'vitest'
import { pathOwner, pickFrontier, scopeMatches, type AuditEntry } from '../src/frontier.js'

function audit(id: string, finalCommit: string, scope: string[], date = '2024-06-01'): AuditEntry {
  return {
    id,
    repo: 'euler-xyz/euler-vault-kit',
    firm: 'X',
    date,
    commits: { reviewed: finalCommit, final: finalCommit },
    scope,
    report: '',
    confidence: 'high',
    signed_off: false,
  }
}

describe('pathOwner', () => {
  it('attributes repo-native sources to the contract repo', () => {
    expect(pathOwner('src/EVault/EVault.sol', 'euler-xyz/euler-vault-kit')).toEqual({
      repo: 'euler-xyz/euler-vault-kit',
      relPath: 'src/EVault/EVault.sol',
    })
  })

  it('attributes lib sources to the owning euler repo', () => {
    expect(pathOwner('lib/ethereum-vault-connector/src/Set.sol', 'euler-xyz/euler-vault-kit')).toEqual({
      repo: 'euler-xyz/ethereum-vault-connector',
      relPath: 'src/Set.sol',
    })
  })

  it('resolves nested euler libs to the deepest owner', () => {
    expect(pathOwner('lib/euler-vault-kit/lib/ethereum-vault-connector/src/Set.sol', 'euler-xyz/evk-periphery')).toEqual({
      repo: 'euler-xyz/ethereum-vault-connector',
      relPath: 'src/Set.sol',
    })
  })

  it('classifies third-party deps as external', () => {
    expect(pathOwner('lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol', 'euler-xyz/euler-earn')).toEqual({
      external: 'openzeppelin-contracts',
    })
  })

  it('classifies test/script sources as build-only', () => {
    expect(pathOwner('test/mocks/MockToken.sol', 'euler-xyz/euler-vault-kit')).toEqual({ buildOnly: true })
  })
})

describe('scopeMatches', () => {
  it('matches exact files and directory prefixes', () => {
    expect(scopeMatches(['src/EVault/Dispatch.sol'], 'src/EVault/Dispatch.sol')).toBe(true)
    expect(scopeMatches(['src/EVault/'], 'src/EVault/modules/Vault.sol')).toBe(true)
    expect(scopeMatches(['src/'], 'src/anything/Deep.sol')).toBe(true)
  })

  it('supports trailing glob stars as prefixes', () => {
    expect(scopeMatches(['src/EVault/**'], 'src/EVault/shared/Base.sol')).toBe(true)
    expect(scopeMatches(['src/EVault/**'], 'src/GenericFactory/GenericFactory.sol')).toBe(false)
  })

  it('does not match partial path segments or unrelated dirs', () => {
    expect(scopeMatches(['src/EVault/Dispatch.sol'], 'src/EVault/Dispatch2.sol')).toBe(false)
    expect(scopeMatches(['src/Synths/'], 'src/EVault/EVault.sol')).toBe(false)
  })
})

describe('pickFrontier (ancestry-ordered, date tiebreak flagged)', () => {
  // Synthetic ancestry: a1 -> a2 -> a3 linear; b1 on a side branch off a1.
  const order: Record<string, string[]> = {
    a1: ['a1', 'a2', 'a3'],
    a2: ['a2', 'a3'],
    a3: ['a3'],
    b1: ['b1'],
  }
  const isAncestor = async (_dir: string, a: string, b: string) => order[a]?.includes(b) ?? false

  it('picks the latest audit by ancestry regardless of array order', async () => {
    const picked = await pickFrontier([audit('new', 'a3', ['src/']), audit('old', 'a1', ['src/']), audit('mid', 'a2', ['src/'])], '.', isAncestor)
    expect(picked?.audit.id).toBe('new')
    expect(picked?.ancestryAmbiguous).toBe(false)
  })

  it('flags incomparable branches and falls back to date', async () => {
    const picked = await pickFrontier(
      [audit('main-line', 'a2', ['src/'], '2024-05-01'), audit('side-branch', 'b1', ['src/'], '2024-07-01')],
      '.',
      isAncestor,
    )
    expect(picked?.audit.id).toBe('side-branch')
    expect(picked?.ancestryAmbiguous).toBe(true)
  })

  it('returns null with no candidates', async () => {
    expect(await pickFrontier([], '.', isAncestor)).toBeNull()
  })
})
