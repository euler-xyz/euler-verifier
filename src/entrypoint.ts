import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** True when the module at `moduleUrl` is the script node was started with, not an import. */
export function isEntrypoint(moduleUrl: string): boolean {
  return process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(moduleUrl)
}
