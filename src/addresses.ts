import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type Sections = Record<string, Record<string, unknown>>

/**
 * A chain's address files merged the way euler-interfaces chains.js builds
 * EulerChains.json: each `<Group>Addresses.json` of `config/addresses/<id>/`
 * is applied over the same file of `addresses/<id>/`. These are the
 * addresses consumers receive.
 */
export function chainAddressFiles(addressesDir: string, chainId: number): Sections {
  const dirs = [join(addressesDir, String(chainId)), join(dirname(addressesDir), 'config', 'addresses', String(chainId))]
  const sections: Sections = {}
  for (const dir of dirs.filter((d) => existsSync(d))) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('Addresses.json')).sort()) {
      const values = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, unknown>
      sections[file] = { ...sections[file], ...values }
    }
  }
  return sections
}

/** Chains with address files under addresses/ or the config/addresses overlay; chains.js publishes either. */
export function addressChainIds(addressesDir: string): number[] {
  const dirs = [addressesDir, join(dirname(addressesDir), 'config', 'addresses')].filter((d) => existsSync(d))
  const ids = dirs.flatMap((d) => readdirSync(d).filter((entry) => /^\d+$/.test(entry)))
  return [...new Set(ids)].map(Number).sort((a, b) => a - b)
}

/** The effective address of `key` on `chainId`: the first non-zero value across the merged files, in file-name order. */
export function resolveAddress(addressesDir: string, chainId: number, key: string): string | null {
  const sections = chainAddressFiles(addressesDir, chainId)
  for (const file of Object.keys(sections).sort()) {
    const value = sections[file]![key]
    if (typeof value === 'string' && value !== '' && value.toLowerCase() !== ZERO_ADDRESS) return value
  }
  return null
}

/** chains.js names each group by its file: CoreAddresses.json -> coreAddrs. */
function registrySection(file: string): string {
  const section = file.replace(/Addresses[.]json$/, 'Addrs')
  return section.charAt(0).toLowerCase() + section.slice(1)
}

/**
 * Chains whose `addresses` in EulerChains.json differ from the merged address
 * files, i.e. a registry that `node chains.js` has not regenerated. Rows
 * without `addresses` are not compared.
 */
export function staleRegistryChains(chainsPath: string, addressesDir: string): number[] {
  if (!existsSync(chainsPath)) return []
  const rows = JSON.parse(readFileSync(chainsPath, 'utf8')) as Array<{ chainId: number; addresses?: Record<string, unknown> }>
  return rows
    .filter((row) => row.addresses !== undefined)
    .filter((row) => {
      const merged = Object.fromEntries(
        Object.entries(chainAddressFiles(addressesDir, row.chainId)).map(([file, values]) => [registrySection(file), values]),
      )
      return canonicalJson(merged) !== canonicalJson(row.addresses)
    })
    .map((row) => row.chainId)
}

/** Throws when EulerChains.json lags the address files, so what is verified is what consumers receive. */
export function assertRegistryCurrent(chainsPath: string, addressesDir: string): void {
  const stale = staleRegistryChains(chainsPath, addressesDir)
  if (stale.length) {
    throw new Error(
      `EulerChains.json addresses differ from addresses/ and config/addresses/ for chain(s) ${stale.join(', ')}: run node chains.js in euler-interfaces`,
    )
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}
