#!/usr/bin/env tsx
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chainsPathFor, loadNetworks } from './networks.js'
import { assertRegistryCurrent, resolveAddress } from './addresses.js'
import { iterateManifest, verifyDelegatedCode, verifyEntry } from './verify.js'
import type { Manifest, ManifestEntry, VerdictKind, VerificationRecord } from './types.js'
import { loadDotEnv } from './entrypoint.js'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PASSING = new Set<VerdictKind>(['MATCH', 'WAIVED', 'CANONICAL'])

function pinOf(entry: ManifestEntry): { commit?: string; contractName?: string } {
  return entry.verified === 'canonical' ? {} : { commit: entry.commit, contractName: entry.contractName }
}

const HELP = `euler-verifier engine — bytecode-level verification of deployed contracts

Usage:
  pnpm verify --manifest <path> --addresses <euler-interfaces/addresses> [options]

Options:
  --manifest <path>    Manifest JSON (chainId -> contract key -> entry). Required.
  --addresses <dir>    euler-interfaces addresses/ directory. Required. Each
                       address is the one consumers receive: config/addresses/
                       overrides applied, as in EulerChains.json.
  --chains <path>      euler-interfaces EulerChains.json: the chains, their
                       explorers and the viem chain whose name and default RPCs
                       are used (default: EulerChains.json beside --addresses).
  --chain <id>         Only verify this chain.
  --contract <key>     Only verify this manifest key (e.g. evc).
  --repos-dir <dir>    Where engine-managed source checkouts live
                       (default: <repo>/repos/engine).
  --no-explorer        Skip the untrusted explorer cross-check.
  --json               Emit JSON records instead of human-readable lines.

Environment (all optional; viem's default public RPCs are used otherwise):
  DEPLOYMENT_RPC_URL_<chainId>   RPC endpoint override per chain
  ETHERSCAN_API_KEY              explorer cross-check only

An implementation that MATCHes also has its delegated code proven from the
same pin: the eight EVault modules, and EulerSwap V2's management contract.

Exit code: 0 if every selected entry and its delegated code is MATCH, WAIVED or
CANONICAL (a listed canonical exception at its bound address); 1 otherwise.`

async function main(): Promise<number> {
  loadDotEnv()
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      addresses: { type: 'string' },
      chains: { type: 'string' },
      chain: { type: 'string' },
      contract: { type: 'string' },
      'repos-dir': { type: 'string' },
      'no-explorer': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  if (values.help || !values.manifest || !values.addresses) {
    console.log(HELP)
    return values.help ? 0 : 1
  }

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Manifest
  const addressesDir = resolve(values.addresses)
  const chainsPath = chainsPathFor(values)
  assertRegistryCurrent(chainsPath, addressesDir)
  const networks = loadNetworks(chainsPath)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT_DIR, 'repos', 'engine')
  const opts = { reposDir, networks, explorer: !values['no-explorer'] }

  const selection = {
    chainId: values.chain !== undefined ? Number(values.chain) : undefined,
    contract: values.contract,
  }

  const records: VerificationRecord[] = []

  for (const { chainId, key, entry } of iterateManifest(manifest, selection)) {
    const located = addressOf(addressesDir, chainId, key, entry)
    if ('error' in located) {
      const record: VerificationRecord = {
        chainId,
        key,
        address: '',
        verdict: 'ERROR',
        repo: entry.repo,
        ...pinOf(entry),
        error: located.error,
      }
      records.push(record)
      if (!values.json) printHuman(record)
      continue
    }
    const { address } = located

    if (!values.json) {
      const against = entry.verified === 'canonical' ? `${entry.repo} (canonical)` : `${entry.repo}@${entry.commit.slice(0, 8)}`
      console.log(`verifying chain=${chainId} ${key} @ ${address} against ${against} ...`)
    }
    const record = await verifyEntry(chainId, key, address, entry, opts)
    records.push(record)
    if (!values.json) printHuman(record)
  }

  for (const chainId of [...new Set(records.map((r) => r.chainId))]) {
    const matched = new Set(records.filter((r) => r.chainId === chainId && r.verdict === 'MATCH').map((r) => r.key))
    const delegated = await verifyDelegatedCode(chainId, manifest[String(chainId)] ?? {}, matched, addressesDir, opts)
    records.push(...delegated)
    if (!values.json) delegated.forEach(printHuman)
  }

  if (values.json) console.log(JSON.stringify(records, null, 2))

  // Fail closed: an empty selection must not pass vacuously (a typo in
  // --chain/--contract would otherwise bypass a verification gate).
  if (records.length === 0) {
    console.error(
      `error: selection matched no manifest entries (chain=${values.chain ?? 'any'}, contract=${values.contract ?? 'any'})`,
    )
    return 1
  }

  const ok = records.every((r) => PASSING.has(r.verdict))
  if (!values.json) {
    const counts = records.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.verdict]: (acc[r.verdict] ?? 0) + 1 }), {})
    console.log(`\nsummary: ${JSON.stringify(counts)} -> ${ok ? 'OK' : 'FAILED'}`)
  }
  return ok ? 0 : 1
}

function addressOf(addressesDir: string, chainId: number, key: string, entry: ManifestEntry): { address: string } | { error: string } {
  if ('address' in entry) return { error: 'manifest address overrides are not allowed: addresses come from euler-interfaces' }
  try {
    const address = resolveAddress(addressesDir, chainId, key)
    return address ? { address } : { error: `address for "${key}" not found under ${addressesDir}/${chainId}/ or its config/addresses overlay` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

function printHuman(r: VerificationRecord): void {
  const head = `  ${r.verdict.padEnd(8)} chain=${r.chainId} ${r.key}`
  if (r.verdict === 'MATCH') {
    const via = r.implementation ? ` (implementation ${r.implementation})` : ''
    const sha = r.evidence ? ` sha256(masked,stripped)=${r.evidence.strippedChainSha256?.slice(0, 16)}` : ` ${r.address}`
    console.log(`${head}${sha}${via}${r.rpcUrl ? ` via ${r.rpcUrl}` : ''}`)
  } else if (r.verdict === 'MISMATCH') {
    const e = r.evidence
    const why =
      e && e.chainCodeSize !== e.artifactCodeSize
        ? `size ${e.chainCodeSize} (chain) vs ${e.artifactCodeSize} (build)`
        : `first divergence at byte ${e?.firstDivergence}`
    console.log(`${head} ${why}`)
  } else if (r.verdict === 'WAIVED') {
    console.log(`${head} reason: ${r.waiver?.reason} (signed: ${r.waiver?.signed_by})`)
  } else if (r.verdict === 'CANONICAL') {
    console.log(`${head} ${r.note}`)
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
