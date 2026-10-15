import type { ExplorerCrossCheck, NetworkInfo } from './types.js'

const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api'
const SOURCIFY = 'https://sourcify.dev/server'

/**
 * Thin explorer cross-check. This is a SECONDARY, UNTRUSTED signal shown in
 * reports for convenience — it never influences the verdict, and any failure
 * degrades to "unavailable" rather than an error.
 */
export async function explorerCrossCheck(
  network: NetworkInfo | undefined,
  address: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ExplorerCrossCheck> {
  const verifier = network?.verifier
  if (!network || !verifier) return { status: 'unavailable', detail: 'no verifier in EulerChains.json' }

  // Per-chain overrides, following the evk-periphery convention
  // (VERIFIER_URL_<chainId> / VERIFIER_API_KEY_<chainId>).
  const urlOverride = env[`VERIFIER_URL_${network.chainId}`]?.trim()
  const apiKey = env[`VERIFIER_API_KEY_${network.chainId}`]?.trim()

  try {
    switch (verifier.type) {
      case 'etherscan': {
        const key = apiKey ?? env.ETHERSCAN_API_KEY ?? ''
        return await etherscanSource(urlOverride || ETHERSCAN_V2, `chainid=${network.chainId}&`, address, key)
      }
      case 'blockscout':
      case 'custom': {
        const base = urlOverride || verifier.url
        if (!base) return { status: 'unavailable', detail: `verifier ${verifier.type} has no url` }
        return await etherscanSource(base, '', address, apiKey)
      }
      case 'sourcify':
        return await sourcifyMatch(urlOverride || verifier.url || SOURCIFY, network.chainId, address)
      default:
        return { status: 'unavailable', detail: `unsupported verifier type ${String((verifier as { type: unknown }).type)}` }
    }
  } catch (err) {
    return { status: 'unavailable', detail: err instanceof Error ? err.message.split('\n')[0] : String(err) }
  }
}

/** Etherscan-compatible `getsourcecode`, served by Etherscan V2, Blockscout and Routescan alike. */
async function etherscanSource(base: string, chainParam: string, address: string, apiKey?: string): Promise<ExplorerCrossCheck> {
  const key = apiKey ? `&apikey=${apiKey}` : ''
  const { body } = await fetchJson(`${base}?${chainParam}module=contract&action=getsourcecode&address=${address}${key}`)
  const data = body as { status?: string; result?: string | Array<{ SourceCode?: string; ContractName?: string; CompilerVersion?: string }> }
  // API-level failures (missing key, rate limit) return result as a string.
  if (data.status !== '1') {
    return { status: 'unavailable', detail: typeof data.result === 'string' ? data.result : 'API error' }
  }
  const r = Array.isArray(data.result) ? data.result[0] : undefined
  return r?.SourceCode
    ? { status: 'verified', contractName: r.ContractName, compilerVersion: r.CompilerVersion }
    : { status: 'unverified' }
}

/** Sourcify API v2: a 404 means no match. */
async function sourcifyMatch(base: string, chainId: number, address: string): Promise<ExplorerCrossCheck> {
  const { status, body } = await fetchJson(`${base}/v2/contract/${chainId}/${address}?fields=compilation`, [404])
  const data = body as { match?: string | null; compilation?: { name?: string; compilerVersion?: string } } | null
  if (status === 404 || !data?.match) return { status: 'unverified' }
  return { status: 'verified', contractName: data.compilation?.name, compilerVersion: data.compilation?.compilerVersion }
}

async function fetchJson(url: string, acceptedErrors: number[] = []): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok && !acceptedErrors.includes(res.status)) throw new Error(`HTTP ${res.status}`)
    return { status: res.status, body: await res.json().catch(() => null) }
  } finally {
    clearTimeout(timer)
  }
}
