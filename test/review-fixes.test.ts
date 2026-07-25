import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromHex, splitMetadata } from '../src/metadata.js'
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
      execFileAsync(tsx, ['src/cli.ts', '--manifest', 'manifests/manifest.json', '--chain', '999999', '--no-explorer'], {
        cwd: ROOT,
        timeout: 60_000,
      }),
    ).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('matched no manifest entries') })
  })

  it('CLI exits non-zero when --contract matches nothing', async () => {
    const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
    await expect(
      execFileAsync(tsx, ['src/cli.ts', '--manifest', 'manifests/manifest.json', '--contract', 'nope', '--no-explorer'], {
        cwd: ROOT,
        timeout: 60_000,
      }),
    ).rejects.toMatchObject({ code: 1 })
  })
})

describe('PR #38 review finding 3: strip metadata before comparing lengths', () => {
  const runtime = [0x60, 0x00]

  // Two VALID solidity metadata trailers of different lengths.
  const SOLC_CBOR = [0xa1, 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, 0x00, 0x08, 0x18] // 10 bytes
  const IPFS_CBOR = [0xa1, 0x64, 0x69, 0x70, 0x66, 0x73, 0x58, 0x22, 0x12, 0x20, ...Array.from({ length: 32 }, () => 0xcd)] // 42 bytes

  function withValidTrailer(runtimeBytes: number[], cbor: number[]): Uint8Array {
    return Uint8Array.from([...runtimeBytes, ...cbor, (cbor.length >> 8) & 0xff, cbor.length & 0xff])
  }

  it('identical runtimes with different-length VALID trailers MATCH', () => {
    const a = withValidTrailer(runtime, SOLC_CBOR)
    const b = withValidTrailer(runtime, IPFS_CBOR)
    expect(a.length).not.toBe(b.length)
    const { match, evidence } = compareRuntime(a, b, {})
    expect(match).toBe(true)
    expect(evidence.chainRuntimeSize).toBe(evidence.artifactRuntimeSize)
  })

  it('different runtimes still mismatch regardless of trailers', () => {
    const { match } = compareRuntime(withValidTrailer([0x60, 0x01], SOLC_CBOR), withValidTrailer(runtime, SOLC_CBOR), {})
    expect(match).toBe(false)
  })

  it('immutable ranges are bounds-checked against the stripped runtime', () => {
    // Range points into the metadata region — must throw, not silently pass.
    const code = withValidTrailer([0x60, 0x00, 0x60, 0x00], SOLC_CBOR)
    expect(() => compareRuntime(code, code, { '1': [{ start: 3, length: 4 }] })).toThrow(/out of bounds/)
  })
})

describe('PR #38 review finding 5: claimed metadata must be valid CBOR before stripping', () => {
  it("the reviewer's repro no longer MATCHes: 0x60005b0001 vs 0x6000a00001", () => {
    const a = fromHex('0x60005b0001')
    const b = fromHex('0x6000a00001')
    const { match } = compareRuntime(a, b, {})
    expect(match).toBe(false)
  })

  it('an incomplete CBOR byte-string header is not stripped', () => {
    // 0x5b = start of a byte string with 8-byte length — truncated, invalid.
    const code = fromHex('0x60005b0001')
    const { runtime, cbor } = splitMetadata(code)
    expect(cbor).toBeNull()
    expect(runtime).toEqual(code)
  })

  it('a truncated valid-looking map is not stripped', () => {
    // map1{"solc": bytes3} but claimed length cuts the value short
    const code = Uint8Array.from([0x60, 0x00, 0xa1, 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, 0x00, 0x00, 0x07])
    expect(splitMetadata(code).cbor).toBeNull()
  })

  it('a valid map followed by trailing garbage is not stripped', () => {
    const valid = [0xa1, 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, 0x00, 0x08, 0x18]
    const code = Uint8Array.from([0x60, 0x00, ...valid, 0xff, 0x00, valid.length + 1])
    expect(splitMetadata(code).cbor).toBeNull()
  })

  it('unknown map keys are rejected', () => {
    // map1{"evil": bytes0}
    const cbor = [0xa1, 0x64, 0x65, 0x76, 0x69, 0x6c, 0x40]
    const code = Uint8Array.from([0x60, 0x00, ...cbor, 0x00, cbor.length])
    expect(splitMetadata(code).cbor).toBeNull()
  })

  it('still strips a genuine solc trailer (real EVC fixture covered elsewhere)', () => {
    const cbor = [0xa2, 0x64, 0x69, 0x70, 0x66, 0x73, 0x58, 0x22, 0x12, 0x20, ...Array.from({ length: 32 }, () => 0xab), 0x64, 0x73, 0x6f, 0x6c, 0x63, 0x43, 0x00, 0x08, 0x18]
    const code = Uint8Array.from([0x60, 0x00, ...cbor, 0x00, cbor.length])
    const { runtime, cbor: got } = splitMetadata(code)
    expect(got).not.toBeNull()
    expect(runtime.length).toBe(2)
  })
})
