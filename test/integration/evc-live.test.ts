import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAtCommit } from '../../src/compile.js'
import { compareRuntime } from '../../src/bytecode.js'
import { fromHex, toHex } from '../../src/metadata.js'
import { loadNetworks } from '../../src/networks.js'
import { fetchDeployedCode, resolveRpcUrls } from '../../src/rpc.js'
import { verifyEntry } from '../../src/verify.js'
import type { CompileProfile } from '../../src/types.js'

/**
 * P1 acceptance (run with RUN_INTEGRATION=1, requires git + forge + network):
 * from a clean checkout, freshly clone and build ethereum-vault-connector at
 * the two pinned deployment commits and prove the deployed EVC bytecode on
 * mainnet, Base, and Arbitrum — plus prove that a wrong commit fails loudly.
 */

const RUN = process.env.RUN_INTEGRATION === '1'
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const FIXTURES = join(HERE, '..', 'fixtures')

const PROFILE: CompileProfile = { context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 20000, evm_version: 'cancun' }
const REPO = 'euler-xyz/ethereum-vault-connector'
const CONTRACT = 'EthereumVaultConnector'

const COMMITS = {
  '084b3228': '084b32284ba643921f8d21bff3ddaf0c4e08d754',
  a7d3c29e: 'a7d3c29ef7e4964736e47675e0588630d6afbfd7',
} as const

const DEPLOYMENTS: Array<{ chainId: number; address: string; commitTag: keyof typeof COMMITS }> = [
  { chainId: 1, address: '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383', commitTag: '084b3228' },
  { chainId: 8453, address: '0x5301c7dD20bD945D2013b48ed0DEE3A284ca8989', commitTag: 'a7d3c29e' },
  { chainId: 42161, address: '0x6302ef0F34100CDDFb5489fbcB6eE1AA95CD1066', commitTag: 'a7d3c29e' },
]

describe.skipIf(!RUN)('EVC live acceptance', () => {
  const reposDir = join(ROOT, 'repos', 'engine')
  const builds = new Map<string, Awaited<ReturnType<typeof buildAtCommit>>>()
  const networks = loadNetworks(ROOT)

  it('builds both pinned commits and reproduces the recorded artifacts byte-for-byte', async () => {
    for (const [tag, commit] of Object.entries(COMMITS)) {
      const built = await buildAtCommit({ repo: REPO, commit, contractName: CONTRACT, profile: PROFILE, reposDir })
      builds.set(tag, built)

      const fixture = JSON.parse(readFileSync(join(FIXTURES, 'artifacts', `evc-${tag}.json`), 'utf8')) as {
        deployedBytecode: string
      }
      // Build determinism / fixture drift guard.
      expect(toHex(built.code)).toBe(fixture.deployedBytecode.replace(/^0x/, ''))
    }
  })

  for (const { chainId, address, commitTag } of DEPLOYMENTS) {
    it(`proves chain ${chainId} EVC == ${REPO}@${commitTag}`, async () => {
      const built = builds.get(commitTag)
      expect(built, 'build step must have run first').toBeDefined()

      const urls = resolveRpcUrls(chainId, networks.get(chainId))
      const { code } = await fetchDeployedCode(chainId, address, urls)

      // Live chain code must equal the recorded fixture (code at an address cannot change).
      const fixture = readFileSync(join(FIXTURES, 'chaincode', `${chainId}-evc.hex`), 'utf8').trim()
      expect(toHex(code)).toBe(fixture.replace(/^0x/, ''))

      const { match, evidence } = compareRuntime(code, built!.code, built!.immutableReferences)
      expect(match, `expected MATCH, evidence: ${JSON.stringify(evidence)}`).toBe(true)
    })
  }

  it('fails loudly on a wrong commit (mainnet vs the base/arbitrum pin)', async () => {
    const built = builds.get('a7d3c29e')
    expect(built).toBeDefined()

    const urls = resolveRpcUrls(1, networks.get(1))
    const { code } = await fetchDeployedCode(1, '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383', urls)
    const { match, evidence } = compareRuntime(code, built!.code, built!.immutableReferences)
    expect(match).toBe(false)
    expect(evidence.chainCodeSize).not.toBe(evidence.artifactCodeSize)
  })

  it('verifyEntry end-to-end returns MATCH for mainnet EVC', async () => {
    const record = await verifyEntry(
      1,
      'evc',
      '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383',
      { repo: REPO, commit: COMMITS['084b3228'], contractName: CONTRACT, profile: PROFILE },
      { reposDir, networks, explorer: false },
    )
    expect(record.verdict).toBe('MATCH')
    expect(record.evidence?.strippedChainSha256).toBe(record.evidence?.strippedArtifactSha256)
  })

  it('rejects branch pins by design', async () => {
    await expect(
      buildAtCommit({ repo: REPO, commit: 'master', contractName: CONTRACT, profile: PROFILE, reposDir }),
    ).rejects.toThrow(/not a full 40-hex commit SHA/)
  })

  it('sanity: fixtures are internally consistent', () => {
    const one = fromHex(readFileSync(join(FIXTURES, 'chaincode', '1-evc.hex'), 'utf8').trim())
    expect(one.length).toBe(21989)
  })
})
