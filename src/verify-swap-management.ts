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
 *     --addresses <euler-interfaces>/addresses --out <dir> [--chain N]
 */
import { parseArgs } from 'node:util'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPublicClient, http, getAddress, parseAbi } from 'viem'
import { loadNetworks } from './networks.js'
import { resolveAddress } from './addresses.js'
import { buildAtCommit } from './compile.js'
import { compareRuntime } from './bytecode.js'
import { fetchDeployedCode, resolveRpcUrls } from './rpc.js'
import { embeddedAddressSet } from './modules.js'
import type { CompileProfile } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ABI = parseAbi(['function managementImpl() view returns (address)'])

interface ProvenEntry {
  repo: string
  commit: string
  profile: (CompileProfile & { context?: string }) | undefined
}

async function readManagementAddress(implementation: string, urls: string[]): Promise<string> {
  const failures: string[] = []
  for (const url of urls) {
    try {
      const client = createPublicClient({ transport: http(url, { timeout: 15_000, retryCount: 1 }) })
      const addr = (await client.readContract({
        address: getAddress(implementation),
        abi: ABI,
        functionName: 'managementImpl',
      })) as string
      return getAddress(addr)
    } catch (err) {
      failures.push(`${url}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }
  throw new Error(`managementImpl() failed on all endpoints:\n  ${failures.join('\n  ')}`)
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
    console.error('usage: verify-swap-management --manifest <json> --addresses <dir> --out <dir> [--chain N]')
    return 1
  }

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<
    string,
    Record<string, ProvenEntry>
  >
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
    const impl = contracts.eulerSwapV2Implementation
    if (!impl?.commit) continue
    const implAddress = resolveAddress(addressesDir, chainId, 'eulerSwapV2Implementation')
    if (!implAddress) {
      results[chainStr] = { error: 'eulerSwapV2Implementation address not found' }
      ok = false
      continue
    }

    try {
      const urls = resolveRpcUrls(chainId, networks.get(chainId))
      const managementAddress = await readManagementAddress(implAddress, urls)
      const profile: CompileProfile | 'native' =
        impl.profile?.context === 'native' ? 'native' : (impl.profile as CompileProfile)

      const implChain = await fetchDeployedCode(chainId, implAddress, urls)
      const implBuild = await buildAtCommit({
        repo: impl.repo,
        commit: impl.commit,
        contractName: 'EulerSwap',
        profile,
        reposDir,
      })
      const crossChecked = embeddedAddressSet(implChain.code, implBuild.immutableReferences).has(managementAddress)

      const artifact = await buildAtCommit({
        repo: impl.repo,
        commit: impl.commit,
        contractName: 'EulerSwapManagement',
        profile,
        reposDir,
      })
      const { code } = await fetchDeployedCode(chainId, managementAddress, urls)
      const { match, evidence } = compareRuntime(code, artifact.code, artifact.immutableReferences)

      const verdict = match && crossChecked ? 'MATCH' : 'MISMATCH'
      if (verdict !== 'MATCH') ok = false
      results[chainStr] = {
        implementation: implAddress,
        managementAddress,
        pin: `${impl.repo}@${impl.commit}`,
        verdict,
        crossCheckedInImplementation: crossChecked,
        strippedSha256: evidence.strippedChainSha256,
      }
      console.log(`${verdict.padEnd(8)} chain ${chainId} EulerSwapManagement ${managementAddress} xcheck=${crossChecked}`)
    } catch (err) {
      results[chainStr] = { error: err instanceof Error ? err.message.slice(0, 500) : String(err) }
      ok = false
      console.log(`ERROR    chain ${chainId}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`)
    }
  }

  writeFileSync(join(outDir, 'swap-management.json'), JSON.stringify(results, null, 1))
  console.log(ok ? '\nall management implementations verified' : '\nmanagement verification has failures')
  return ok ? 0 : 1
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
