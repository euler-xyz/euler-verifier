import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadDotEnv } from '../src/entrypoint.js'

const KEYS = ['DEPLOYMENT_RPC_URL_424242', 'DEPLOYMENT_RPC_URL_424243']
const dirs: string[] = []

const root = (env?: string) => {
  const dir = mkdtempSync(join(tmpdir(), 'verifier-dotenv-'))
  dirs.push(dir)
  if (env !== undefined) writeFileSync(join(dir, '.env'), env)
  return dir
}

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('loadDotEnv', () => {
  it('loads the .env in the repository root', () => {
    loadDotEnv(root('DEPLOYMENT_RPC_URL_424242=https://rpc.example\n'))
    expect(process.env.DEPLOYMENT_RPC_URL_424242).toBe('https://rpc.example')
  })

  it('keeps a variable already set in the environment', () => {
    process.env.DEPLOYMENT_RPC_URL_424243 = 'https://shell.example'
    loadDotEnv(root('DEPLOYMENT_RPC_URL_424243=https://file.example\n'))
    expect(process.env.DEPLOYMENT_RPC_URL_424243).toBe('https://shell.example')
  })

  it('does nothing without a .env', () => {
    loadDotEnv(root())
    expect(process.env.DEPLOYMENT_RPC_URL_424242).toBeUndefined()
  })
})
