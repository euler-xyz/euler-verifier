import type { ExplorerCrossCheck, NetworkInfo } from './types.js'

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
  // Per-chain overrides, following the evk-periphery convention
  // (VERIFIER_URL_<chainId> / VERIFIER_API_KEY_<chainId>).
  const apiOverride = network ? env[`VERIFIER_URL_${network.chainId}`] : undefined
  const explorerApi = apiOverride?.trim() || network?.explorerApi
  if (!network || !explorerApi) return { status: 'unavailable', detail: 'no explorer configured' }

  try {
    if (network.apiType === 'etherscan_v2') {
      const apiKey = env[`VERIFIER_API_KEY_${network.chainId}`] ?? env.ETHERSCAN_API_KEY ?? ''
      const url = `${explorerApi}?chainid=${network.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
      const data = (await fetchJson(url)) as { status?: string; result?: string | Array<{ SourceCode?: string; ContractName?: string; CompilerVersion?: string }> }
      // API-level failures (missing key, rate limit) return result as a string.
      if (data.status !== '1') {
        const detail = typeof data.result === 'string' ? data.result : 'API error'
        return { status: 'unavailable', detail }
      }
      const r = Array.isArray(data.result) ? data.result[0] : undefined
      if (r?.SourceCode) {
        return { status: 'verified', contractName: r.ContractName, compilerVersion: r.CompilerVersion }
      }
      return { status: 'unverified' }
    }

    if (network.apiType === 'blockscout_v2') {
      const data = (await fetchJson(`${explorerApi}/smart-contracts/${address}`)) as {
        name?: string
        compiler_version?: string
      } | null
      if (data && (data.name || data.compiler_version)) {
        return { status: 'verified', contractName: data.name, compilerVersion: data.compiler_version }
      }
      return { status: 'unverified' }
    }

    return { status: 'unavailable', detail: `unsupported api_type ${network.apiType}` }
  } catch (err) {
    return { status: 'unavailable', detail: err instanceof Error ? err.message.split('\n')[0] : String(err) }
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
