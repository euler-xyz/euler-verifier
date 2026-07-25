#!/usr/bin/env tsx
/**
 * Completeness gate (plan §2.8): every allowlisted contract present in
 * euler-interfaces addresses/ must have a manifest entry or an explicit
 * waiver — a deployer structurally cannot forget to declare provenance.
 *
 *   pnpm tsx src/check-completeness.ts --manifest <file> --addresses <dir>
 */
import { parseArgs } from 'node:util'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { CONTRACT_SPECS } from './contracts.js'
import { resolveAddress } from './addresses.js'

const { values } = parseArgs({
  options: { manifest: { type: 'string' }, addresses: { type: 'string' } },
})
if (!values.manifest || !values.addresses) {
  console.error('usage: check-completeness --manifest <file> --addresses <dir>')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<
  string,
  Record<string, { waiver?: unknown }>
>
const addressesDir = resolve(values.addresses)

const problems: string[] = []
const chains = readdirSync(addressesDir).filter((d) => /^\d+$/.test(d) && existsSync(join(addressesDir, d)))

for (const chain of chains) {
  for (const key of Object.keys(CONTRACT_SPECS)) {
    const address = resolveAddress(addressesDir, Number(chain), key)
    if (!address) continue // not deployed on this chain
    const entry = manifest[chain]?.[key]
    if (!entry) {
      problems.push(`${chain}/${key} (${address}): deployed but missing from manifest`)
    }
  }
  // Reverse direction: manifest entries for addresses that do not exist.
  for (const key of Object.keys(manifest[chain] ?? {})) {
    if (!CONTRACT_SPECS[key]) {
      problems.push(`${chain}/${key}: manifest key not in the verification allowlist`)
      continue
    }
    if (!resolveAddress(addressesDir, Number(chain), key)) {
      problems.push(`${chain}/${key}: manifest entry without a deployed address`)
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} completeness violation(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`completeness OK across ${chains.length} chains`)
