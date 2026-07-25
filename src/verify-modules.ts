#!/usr/bin/env tsx
/**
 * P3 runner: verify the EVault modules for every chain in a proven manifest.
 *
 *   pnpm tsx src/verify-modules.ts --manifest <manifest.proven.json> \
 *     --addresses <euler-interfaces>/addresses --out <dir> [--chain N] [--repos-dir d]
 */
import { parseArgs } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNetworks } from './networks.js'
import { resolveAddress } from './addresses.js'
import { verifyModules } from './modules.js'
import type { CompileProfile } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

interface ProvenEntry {
  repo: string
  commit: string
  contractName: string
  profile: (CompileProfile & { context?: string }) | undefined
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      addresses: { type: 'string' },
      out: { type: 'string' },
      chain: { type: 'string' },
      'repos-dir': { type: 'string' },
    },
  })
  if (!values.manifest || !values.addresses || !values.out) {
    console.error('usage: verify-modules --manifest <json> --addresses <dir> --out <dir> [--chain N]')
    return 1
  }

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<string, Record<string, ProvenEntry>>
  const networks = loadNetworks(ROOT)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const addressesDir = resolve(values.addresses)
  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })

  const results: Record<string, unknown> = {}
  let ok = true

  for (const [chainStr, contracts] of Object.entries(manifest)) {
    const chainId = Number(chainStr)
    if (values.chain !== undefined && chainId !== Number(values.chain)) continue
    const impl = contracts.eVaultImplementation
    if (!impl) continue
    const implAddress = resolveAddress(addressesDir, chainId, 'eVaultImplementation')
    if (!implAddress) {
      results[chainStr] = { error: 'implementation address not found' }
      ok = false
      continue
    }

    console.log(`modules: chain ${chainId} implementation ${implAddress} @ ${impl.repo}@${impl.commit.slice(0, 8)}`)
    try {
      const records = await verifyModules({
        chainId,
        implementationAddress: implAddress,
        repo: impl.repo,
        commit: impl.commit,
        profile: impl.profile?.context === 'native' ? 'native' : (impl.profile as CompileProfile),
        reposDir,
        networks,
      })
      for (const r of records) {
        console.log(`  ${r.verdict.padEnd(8)} ${r.module.padEnd(17)} ${r.address} xcheck=${r.crossCheckedInImplementation}${r.error ? ` (${r.error.split('\n')[0]})` : ''}`)
        if (r.verdict !== 'MATCH') ok = false
      }
      results[chainStr] = { implementation: implAddress, pin: `${impl.repo}@${impl.commit}`, modules: records }
    } catch (err) {
      results[chainStr] = { error: err instanceof Error ? err.message.slice(0, 500) : String(err) }
      ok = false
    }
  }

  writeFileSync(join(outDir, 'modules.json'), JSON.stringify(results, null, 1))
  console.log(ok ? '\nall modules verified' : '\nmodule verification has failures')
  return ok ? 0 : 1
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
