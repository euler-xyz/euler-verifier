#!/usr/bin/env tsx
/**
 * EulerSwapManagement verification: the EulerSwap V2
 * implementation delegatecalls management functions into a separate
 * EulerSwapManagement contract whose address is the public immutable
 * `managementImpl`. Like the EVault modules, we read the getter, cross-check
 * the value against the implementation's embedded immutable words, then
 * verify the management contract's runtime bytecode from the SAME euler-swap
 * pin already proven for the implementation.
 *
 *   pnpm tsx src/verify-swap-management.ts --manifest <manifest.json> \
 *     --addresses <euler-interfaces>/addresses --out <dir> [--chains <EulerChains.json>] [--chain N]
 */
import { parseArgs } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chainsPathFor, loadNetworks } from './networks.js'
import { resolveAddress } from './addresses.js'
import { verifySwapManagement } from './swap-management.js'
import { isEntrypoint, loadDotEnv } from './entrypoint.js'
import type { CompileProfile, NetworkInfo, SubmoduleOverride } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export interface ProvenEntry {
  repo: string
  commit: string
  profile: (CompileProfile & { context?: string }) | undefined
  evidence?: { submoduleOverrides?: SubmoduleOverride[] }
}

export interface SwapManagementRun {
  manifest: Record<string, Record<string, ProvenEntry>>
  addressesDir: string
  networks: Map<number, NetworkInfo>
  reposDir: string
  chains?: number[]
}

/** Per chain: the management verification, or `{ error }` when it could not complete. ok is false on any failure. */
export async function verifyManifestSwapManagement(run: SwapManagementRun): Promise<{ results: Record<string, unknown>; ok: boolean }> {
  const results: Record<string, unknown> = {}
  let ok = true

  for (const [chainStr, contracts] of Object.entries(run.manifest)) {
    const chainId = Number(chainStr)
    if (run.chains && !run.chains.includes(chainId)) continue
    const impl = contracts.eulerSwapV2Implementation
    if (!impl?.commit) continue
    const implAddress = resolveAddress(run.addressesDir, chainId, 'eulerSwapV2Implementation')
    if (!implAddress || !impl.profile) {
      results[chainStr] = { error: implAddress ? 'eulerSwapV2Implementation has no build profile' : 'eulerSwapV2Implementation address not found' }
      ok = false
      continue
    }
    try {
      const result = await verifySwapManagement({
        chainId,
        implementationAddress: implAddress,
        repo: impl.repo,
        commit: impl.commit,
        profile: impl.profile,
        submoduleOverrides: impl.evidence?.submoduleOverrides,
        reposDir: run.reposDir,
        networks: run.networks,
      })
      if (result.verdict !== 'MATCH') ok = false
      results[chainStr] = result
      console.log(`${result.verdict.padEnd(8)} chain ${chainId} EulerSwapManagement ${result.managementAddress} xcheck=${result.crossCheckedInImplementation}`)
    } catch (err) {
      results[chainStr] = { error: err instanceof Error ? err.message.slice(0, 500) : String(err) }
      ok = false
      console.log(`ERROR    chain ${chainId}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }

  return { results, ok }
}

async function main(): Promise<number> {
  loadDotEnv()
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      addresses: { type: 'string' },
      chains: { type: 'string' },
      out: { type: 'string' },
      chain: { type: 'string' },
      'repos-dir': { type: 'string' },
    },
  })
  if (!values.manifest || !values.addresses || !values.out) {
    console.error('usage: verify-swap-management --manifest <json> --addresses <dir> --out <dir> [--chains <EulerChains.json>] [--chain N]')
    return 1
  }

  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })
  const { results, ok } = await verifyManifestSwapManagement({
    manifest: JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as SwapManagementRun['manifest'],
    addressesDir: resolve(values.addresses),
    networks: loadNetworks(chainsPathFor(values)),
    reposDir: values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine'),
    chains: values.chain !== undefined ? [Number(values.chain)] : undefined,
  })

  writeFileSync(join(outDir, 'swap-management.json'), JSON.stringify(results, null, 1))
  console.log(ok ? '\nall management implementations verified' : '\nmanagement verification has failures')
  return ok ? 0 : 1
}

if (isEntrypoint(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err)
      process.exit(1)
    },
  )
}
