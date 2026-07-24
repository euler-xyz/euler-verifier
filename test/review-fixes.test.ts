import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromHex } from '../src/metadata.js'
import { compareRuntime } from '../src/bytecode.js'
import { iterateManifest } from '../src/verify.js'
import type { Manifest } from '../src/types.js'

const execFileAsync = promisify(execFile)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('PR #38 review finding 1: fail-closed hex parsing', () => {
  it('rejects an unresolved-library Foundry artifact object instead of truncating', () => {
    // Shape captured from a real Forge artifact with an unlinked library:
    // 20-byte push placeholder __$<34 hex chars>$__ embedded in the object.
    const linked =
      '0x73__$05b9886e801ecafedeadbeef0123456789$__6300000000602081905263' +
      '60806040526004361061003f5760003560e01c'
    expect(() => fromHex(linked)).toThrow(/unresolved library link placeholders/)
  })

  it('rejects any non-hex byte with its offset', () => {
    expect(() => fromHex('0xdeadbeeg')).toThrow(/odd-length|invalid hex/)
    expect(() => fromHex('0xdeadbezz')).toThrow(/invalid hex at offset 6/)
  })

  it('never returns a truncated prefix', () => {
    // The permissive Buffer.from behavior would have returned 2 bytes here.
    expect(() => fromHex('0xdead__$aa$__beef')).toThrow(/invalid hex/)
  })
})

describe('PR #38 review finding 2: empty selection fails closed', () => {
  const manifest: Manifest = {
    '1': {
      evc: {
        repo: 'euler-xyz/ethereum-vault-connector',
        commit: '084b32284ba643921f8d21bff3ddaf0c4e08d754',
        contractName: 'EthereumVaultConnector',
        profile: { context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 20000, evm_version: 'cancun' },
      },
    },
  }

  it('iterateManifest yields nothing for a missing chain or contract', () => {
    expect([...iterateManifest(manifest, { chainId: 999999 })]).toHaveLength(0)
    expect([...iterateManifest(manifest, { contract: 'evcTypo' })]).toHaveLength(0)
    expect([...iterateManifest(manifest, {})]).toHaveLength(1)
  })

  it('CLI exits non-zero when --chain matches nothing', async () => {
    const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
    await expect(
      execFileAsync(tsx, ['src/cli.ts', '--manifest', 'manifest.sample.json', '--chain', '999999', '--no-explorer'], {
        cwd: ROOT,
        timeout: 60_000,
      }),
    ).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('matched no manifest entries') })
  })

  it('CLI exits non-zero when --contract matches nothing', async () => {
    const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
    await expect(
      execFileAsync(tsx, ['src/cli.ts', '--manifest', 'manifest.sample.json', '--contract', 'nope', '--no-explorer'], {
        cwd: ROOT,
        timeout: 60_000,
      }),
    ).rejects.toMatchObject({ code: 1 })
  })
})

describe('PR #38 review finding 3: strip metadata before comparing lengths', () => {
  const runtime = [0x60, 0x00]

  function withCbor(runtimeBytes: number[], cborLen: number): Uint8Array {
    const cbor = Array.from({ length: cborLen }, (_, i) => 0xa0 + i)
    return Uint8Array.from([...runtimeBytes, ...cbor, (cborLen >> 8) & 0xff, cborLen & 0xff])
  }

  it('identical runtimes with different-length CBOR trailers MATCH', () => {
    const a = withCbor(runtime, 1)
    const b = withCbor(runtime, 2)
    expect(a.length).not.toBe(b.length)
    const { match, evidence } = compareRuntime(a, b, {})
    expect(match).toBe(true)
    expect(evidence.chainRuntimeSize).toBe(evidence.artifactRuntimeSize)
  })

  it('different runtimes still mismatch regardless of trailers', () => {
    const { match } = compareRuntime(withCbor([0x60, 0x01], 1), withCbor(runtime, 1), {})
    expect(match).toBe(false)
  })

  it('immutable ranges are bounds-checked against the stripped runtime', () => {
    // Range points into the metadata region — must throw, not silently pass.
    const code = withCbor([0x60, 0x00, 0x60, 0x00], 4)
    expect(() => compareRuntime(code, code, { '1': [{ start: 3, length: 4 }] })).toThrow(/out of bounds/)
  })
})
