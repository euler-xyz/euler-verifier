import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** True when the module at `moduleUrl` is the script node was started with, not an import. */
export function isEntrypoint(moduleUrl: string): boolean {
  return process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(moduleUrl)
}

/** Loads `.env` from the repository root, if there is one. A variable already set in the environment wins. */
export function loadDotEnv(root = resolve(dirname(fileURLToPath(import.meta.url)), '..')): void {
  const file = join(root, '.env')
  if (existsSync(file)) process.loadEnvFile(file)
}
