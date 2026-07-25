#!/usr/bin/env tsx
/**
 * P2 proving sweep: consume a tasks file (chain/key/address + ordered
 * candidates), prove every entry with the bytecode engine, and emit
 * manifest fragments + failure diagnostics.
 *
 *   pnpm tsx src/build-manifest.ts --tasks tasks.json --out outdir [--chain N] [--resume]
 */
import { parseArgs } from 'node:util'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNetworks } from './networks.js'
import { BuildCache, proveTask, type ProveOutcome, type ProveTask } from './prove.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      tasks: { type: 'string' },
      out: { type: 'string' },
      chain: { type: 'string' },
      'repos-dir': { type: 'string' },
      'cache-dir': { type: 'string' },
      resume: { type: 'boolean', default: false },
    },
  })
  if (!values.tasks || !values.out) {
    console.error('usage: build-manifest --tasks <tasks.json> --out <dir> [--chain N] [--resume]')
    return 1
  }

  const tasks = (JSON.parse(readFileSync(resolve(values.tasks), 'utf8')) as ProveTask[]).filter(
    (t) => values.chain === undefined || t.chainId === Number(values.chain),
  )
  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })

  const networks = loadNetworks(ROOT)
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const cacheDir = values['cache-dir'] ? resolve(values['cache-dir']) : join(ROOT, 'repos', 'build-cache')
  const cache = new BuildCache(cacheDir, reposDir)

  const outcomes: ProveOutcome[] = []
  const resultsFile = join(outDir, 'outcomes.json')
  const done = new Set<string>()
  if (values.resume && existsSync(resultsFile)) {
    for (const o of JSON.parse(readFileSync(resultsFile, 'utf8')) as ProveOutcome[]) {
      outcomes.push(o)
      done.add(`${o.chainId}/${o.key}`)
    }
    console.log(`resuming: ${outcomes.length} outcomes already recorded`)
  }

  let i = 0
  for (const task of tasks) {
    i++
    const id = `${task.chainId}/${task.key}`
    if (done.has(id)) continue
    console.log(`[${i}/${tasks.length}] ${id} @ ${task.address} (${task.candidates.length} candidates)`)
    const outcome = await proveTask(task, cache, { reposDir, cacheDir, networks, log: (l) => console.log(l) })
    outcomes.push(outcome)
    // Persist incrementally: sweeps are long and must be resumable.
    writeFileSync(resultsFile, JSON.stringify(outcomes, null, 1))
  }

  const proven = outcomes.filter((o) => o.status === 'PROVEN')
  const unproven = outcomes.filter((o) => o.status === 'UNPROVEN')
  const rpcErr = outcomes.filter((o) => o.status === 'RPC_ERROR')

  // Manifest fragment from proven outcomes (schema per plan §2.2 + contractName).
  const manifest: Record<string, Record<string, unknown>> = {}
  for (const o of proven) {
    const m = o.matched!
    const chain = String(o.chainId)
    manifest[chain] ??= {}
    manifest[chain][o.key] = {
      repo: m.repo,
      commit: m.commit,
      contractName: m.contractName,
      profile: m.effectiveProfile
        ? { context: profileContext(m.repo, m.origin), ...m.effectiveProfile }
        : m.profile === 'native'
          ? { context: 'native' }
          : m.profile,
      verified: 'bytecode',
      evidence: { strippedSha256: o.strippedSha256, codeSize: o.chainCodeSize, origin: m.origin },
      waiver: null,
    }
  }

  writeFileSync(join(outDir, 'manifest.proven.json'), JSON.stringify(sortKeys(manifest), null, 1))
  writeFileSync(join(outDir, 'failures.json'), JSON.stringify([...unproven, ...rpcErr], null, 1))

  console.log(`\nsweep: ${proven.length} proven, ${unproven.length} unproven, ${rpcErr.length} rpc-errors of ${outcomes.length}`)
  return 0
}

function profileContext(repo: string, origin: string): string {
  if (origin.includes('explorer')) return 'explorer-settings'
  return repo.split('/')[1] ?? repo
}

function sortKeys<T>(obj: T): T {
  if (Array.isArray(obj) || obj === null || typeof obj !== 'object') return obj
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj as Record<string, unknown>).sort((a, b) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b))) {
    out[k] = sortKeys((obj as Record<string, unknown>)[k])
  }
  return out as T
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
