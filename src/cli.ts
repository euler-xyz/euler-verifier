#!/usr/bin/env tsx
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNetworks } from './networks.js'
import { resolveAddress } from './addresses.js'
import { iterateManifest, verifyEntry } from './verify.js'
import type { Manifest, VerificationRecord } from './types.js'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const HELP = `euler-verifier engine — bytecode-level verification of deployed contracts

Usage:
  pnpm verify --manifest <path> [--addresses <euler-interfaces/addresses>] [options]

Options:
  --manifest <path>    Manifest JSON (chainId -> contract key -> entry). Required.
  --addresses <dir>    euler-interfaces addresses/ directory, used to resolve
                       contract addresses. Entries may carry an explicit
                       "address" override (tests only).
  --chain <id>         Only verify this chain.
  --contract <key>     Only verify this manifest key (e.g. evc).
  --repos-dir <dir>    Where engine-managed source checkouts live
                       (default: <repo>/repos/engine).
  --no-explorer        Skip the untrusted explorer cross-check.
  --json               Emit JSON records instead of human-readable lines.

Environment (see .env.example; Doppler-provided in team setups):
  DEPLOYMENT_RPC_URL_<chainId>   RPC endpoint override per chain
  ETHERSCAN_API_KEY              explorer cross-check only

Exit code: 0 if every selected entry is MATCH or WAIVED; 1 otherwise.`

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      addresses: { type: 'string' },
      chain: { type: 'string' },
      contract: { type: 'string' },
      'repos-dir': { type: 'string' },
      'no-explorer': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  if (values.help || !values.manifest) {
    console.log(HELP)
    return values.help ? 0 : 1
  }

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Manifest
  const networks = loadNetworks(ROOT_DIR)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT_DIR, 'repos', 'engine')
  const addressesDir = values.addresses ? resolve(values.addresses) : null

  const selection = {
    chainId: values.chain !== undefined ? Number(values.chain) : undefined,
    contract: values.contract,
  }

  const records: VerificationRecord[] = []

  for (const { chainId, key, entry } of iterateManifest(manifest, selection)) {
    const address = entry.address ?? (addressesDir ? resolveAddress(addressesDir, chainId, key) : null)
    if (!address) {
      records.push({
        chainId,
        key,
        address: '',
        verdict: 'ERROR',
        repo: entry.repo,
        commit: entry.commit,
        contractName: entry.contractName,
        error: addressesDir
          ? `address for "${key}" not found under ${addressesDir}/${chainId}/`
          : 'no --addresses directory given and entry has no address override',
      })
      continue
    }

    if (!values.json) {
      console.log(`verifying chain=${chainId} ${key} @ ${address} against ${entry.repo}@${entry.commit.slice(0, 8)} ...`)
    }
    const record = await verifyEntry(chainId, key, address, entry, {
      reposDir,
      networks,
      explorer: !values['no-explorer'],
    })
    records.push(record)
    if (!values.json) printHuman(record)
  }

  if (values.json) console.log(JSON.stringify(records, null, 2))

  const ok = records.every((r) => r.verdict === 'MATCH' || r.verdict === 'WAIVED')
  if (!values.json) {
    const counts = records.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.verdict]: (acc[r.verdict] ?? 0) + 1 }), {})
    console.log(`\nsummary: ${JSON.stringify(counts)} -> ${ok ? 'OK' : 'FAILED'}`)
  }
  return ok ? 0 : 1
}

function printHuman(r: VerificationRecord): void {
  const head = `  ${r.verdict.padEnd(8)} chain=${r.chainId} ${r.key}`
  if (r.verdict === 'MATCH') {
    console.log(`${head} sha256(masked,stripped)=${r.evidence?.strippedChainSha256?.slice(0, 16)} via ${r.rpcUrl}`)
  } else if (r.verdict === 'MISMATCH') {
    const e = r.evidence
    const why =
      e && e.chainCodeSize !== e.artifactCodeSize
        ? `size ${e.chainCodeSize} (chain) vs ${e.artifactCodeSize} (build)`
        : `first divergence at byte ${e?.firstDivergence}`
    console.log(`${head} ${why}`)
  } else if (r.verdict === 'WAIVED') {
    console.log(`${head} reason: ${r.waiver?.reason} (signed: ${r.waiver?.signed_by})`)
  } else {
    console.log(`${head} ${r.error}`)
  }
  if (r.explorer) {
    console.log(`           explorer cross-check (untrusted): ${r.explorer.status}${r.explorer.compilerVersion ? ` ${r.explorer.compilerVersion}` : ''}`)
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  },
)
