import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Resolve a contract address from euler-interfaces/addresses/<chainId>/ by
 * scanning every *.json for an exact key match with a non-zero value.
 */
export function resolveAddress(addressesDir: string, chainId: number, key: string): string | null {
  const dir = join(addressesDir, String(chainId))
  if (!existsSync(dir)) return null

  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue
    try {
      const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, unknown>
      const value = data[key]
      if (typeof value === 'string' && value !== '' && value.toLowerCase() !== ZERO_ADDRESS) {
        return value
      }
    } catch {
      // Malformed address file: skip; the manifest completeness check (P4) owns schema validation.
    }
  }
  return null
}
