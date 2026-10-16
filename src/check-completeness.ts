#!/usr/bin/env tsx
/**
 * Completeness gate (plan §2.8): every allowlisted contract present in
 * euler-interfaces addresses/ (with its config/addresses overlay) must have a
 * manifest entry or an explicit waiver, proven at its current address — a
 * deployer structurally cannot forget to declare provenance.
 *
 *   pnpm tsx src/check-completeness.ts --manifest <file> --addresses <dir>
 */
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { CONTRACT_SPECS } from './contracts.js'
import { addressChainIds, resolveAddress, staleRegistryChains } from './addresses.js'
import { staleEntries } from './manifest-work.js'
import type { Manifest } from './types.js'

const { values } = parseArgs({
  options: { manifest: { type: 'string' }, addresses: { type: 'string' } },
})
if (!values.manifest || !values.addresses) {
  console.error('usage: check-completeness --manifest <file> --addresses <dir>')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Manifest
const addressesDir = resolve(values.addresses)

const chains = addressChainIds(addressesDir).map(String)

/** Keys with different addresses in two address groups; nothing else can be checked until they are fixed. */
const ambiguous = chains.flatMap((chain) =>
  [...new Set([...Object.keys(CONTRACT_SPECS), ...Object.keys(manifest[chain] ?? {})])].flatMap((key) => {
    try {
      resolveAddress(addressesDir, Number(chain), key)
      return []
    } catch (err) {
      return [err instanceof Error ? err.message : String(err)]
    }
  }),
)
if (ambiguous.length) {
  console.error(`${ambiguous.length} address(es) differ between address groups:`)
  for (const p of ambiguous) console.error(`  - ${p}`)
  process.exit(1)
}

const problems: string[] = []
const missingChains = new Set<string>()

for (const chain of staleRegistryChains(join(dirname(addressesDir), 'EulerChains.json'), addressesDir)) {
  problems.push(`${chain}: EulerChains.json addresses differ from addresses/ and config/addresses/; run node chains.js`)
}
for (const s of staleEntries(manifest, addressesDir)) {
  problems.push(`${s.chainId}/${s.key} (${s.address}): manifest entry was proven at ${s.proven}; regenerate it`)
  missingChains.add(String(s.chainId))
}

for (const chain of chains) {
  for (const key of Object.keys(CONTRACT_SPECS)) {
    const address = resolveAddress(addressesDir, Number(chain), key)
    if (!address) continue // not deployed on this chain
    const entry = manifest[chain]?.[key]
    if (!entry) {
      problems.push(`${chain}/${key} (${address}): deployed but missing from manifest`)
      missingChains.add(chain)
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

for (const chain of Object.keys(manifest).filter((c) => !chains.includes(c))) {
  problems.push(`${chain}: manifest entries for a chain without address files`)
}

if (problems.length) {
  console.error(`${problems.length} completeness violation(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  if (missingChains.size) {
    const interfaces = process.env.GITHUB_ACTIONS === 'true' ? '<your euler-interfaces checkout>' : dirname(addressesDir)
    const chainArgs = [...missingChains].map((c) => ` --chain ${c}`).join('')
    console.error('\nGenerate the missing or stale entries and their reports from a euler-verifier checkout:')
    console.error(`  pnpm add-entries --interfaces ${interfaces}${chainArgs}`)
    console.error('If the deployed commits are new, add --candidates-from <deploying checkout> or --candidate <repo>@<sha>.')
  }
  process.exit(1)
}
console.log(`completeness OK across ${chains.length} chains`)
