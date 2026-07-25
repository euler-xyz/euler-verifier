#!/usr/bin/env tsx
/**
 * P2 residual classification: for every proven manifest entry, classify each
 * compiled source file against the audit frontier (§2.6).
 *
 *   pnpm tsx src/run-frontier.ts --manifest <manifest.proven.json> \
 *     --audits manifests/audits.json --cache-dir repos/build-cache --out <dir>
 */
import { parseArgs } from 'node:util'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyFile, submodulePins, type AuditEntry, type FileVerdict } from './frontier.js'
import type { CompileProfile } from './types.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

interface ProvenEntry {
  repo: string
  commit: string
  contractName: string
  profile: CompileProfile & { context?: string }
  evidence?: { origin?: string }
}

function candidateKey(repo: string, commit: string, contractName: string, profile: CompileProfile | 'native'): string {
  const p = profile === 'native' ? 'native' : `${profile.solc}|${profile.optimizer_runs}|${profile.evm_version}`
  return createHash('sha1').update(`${repo}|${commit}|${contractName}|${p}`).digest('hex')
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      audits: { type: 'string' },
      'cache-dir': { type: 'string' },
      'repos-dir': { type: 'string' },
      out: { type: 'string' },
    },
  })
  if (!values.manifest || !values.audits || !values.out) {
    console.error('usage: run-frontier --manifest <json> --audits <json> --out <dir> [--cache-dir d] [--repos-dir d]')
    return 1
  }

  const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8')) as Record<string, Record<string, ProvenEntry>>
  const audits = (JSON.parse(readFileSync(resolve(values.audits), 'utf8')) as AuditEntry[]).filter(
    (a) => a.commits?.final,
  )
  const cacheDir = values['cache-dir'] ? resolve(values['cache-dir']) : join(ROOT, 'repos', 'build-cache')
  const reposDir = values['repos-dir'] ? resolve(values['repos-dir']) : join(ROOT, 'repos', 'engine')
  const outDir = resolve(values.out)
  mkdirSync(outDir, { recursive: true })

  // Distinct (repo, commit) pairs share classification work across chains.
  const perPair = new Map<string, { files: FileVerdict[]; sources: string[] }>()
  const results: Record<string, Record<string, unknown>> = {}

  for (const [chain, contracts] of Object.entries(manifest)) {
    for (const [key, entry] of Object.entries(contracts)) {
      // Waived entries carry no proven pin — there is nothing to classify.
      if (!entry.commit || !entry.contractName) continue
      const pairKey = `${entry.repo}@${entry.commit}#${entry.contractName}`
      let pair = perPair.get(pairKey)

      if (!pair) {
        // sources come from the build cache written during the proving sweep
        const profile: CompileProfile | 'native' =
          entry.profile?.context === 'native' ? 'native' : (entry.profile as CompileProfile)
        let sources: string[] = []
        for (const prof of [profile, 'native' as const]) {
          const f = join(cacheDir, `${candidateKey(entry.repo, entry.commit, entry.contractName, prof)}.json`)
          if (existsSync(f)) {
            sources = (JSON.parse(readFileSync(f, 'utf8')) as { sources?: string[] }).sources ?? []
            if (sources.length > 0) break
          }
        }
        if (sources.length === 0) {
          // Cache-key shape mismatch (e.g. override-built winners): rebuild to
          // recover the compilation source list — checkout reuse makes this cheap.
          try {
            const { buildAtCommit } = await import('./compile.js')
            const overrides = (entry as { evidence?: { submoduleOverrides?: Array<{ path: string; ref: string }> } })
              .evidence?.submoduleOverrides
            const built = await buildAtCommit({
              repo: entry.repo,
              commit: entry.commit,
              contractName: entry.contractName,
              profile: 'native',
              reposDir,
              submoduleOverrides: overrides,
            })
            sources = built.sources
          } catch {
            // classified below as an explicit gap rather than silently zero
          }
        }

        const repoDir = join(reposDir, entry.repo.split('/')[1]!)
        const libPins = await submodulePins(repoDir, entry.commit)
        const files: FileVerdict[] = []
        for (const src of sources) {
          files.push(await classifyFile(src, entry.repo, entry.commit, { reposDir, audits }, libPins))
        }
        pair = { files, sources }
        perPair.set(pairKey, pair)
        console.log(`classified ${pairKey}: ${pair.files.length} files`)
      }

      const counts: Record<string, number> = {}
      for (const f of pair.files) counts[f.class.kind] = (counts[f.class.kind] ?? 0) + 1
      const residuals = pair.files.filter((f) => f.class.kind === 'unaudited-residual' || f.class.kind === 'no-audit-found' || f.class.kind === 'error')

      results[chain] ??= {}
      if (pair.files.length === 0) {
        results[chain][key] = {
          repo: entry.repo,
          commit: entry.commit,
          fullyCovered: false,
          fileCount: 0,
          counts: { 'sources-unavailable': 1 },
          residuals: [{ path: '(compilation source list unavailable)', kind: 'error' }],
          auditChain: [],
        }
        continue
      }
      results[chain][key] = {
        repo: entry.repo,
        commit: entry.commit,
        fullyCovered: residuals.length === 0 && pair.files.length > 0,
        fileCount: pair.files.length,
        counts,
        residuals: residuals.map((f) => ({ path: f.path, ...f.class })),
        auditChain: [...new Set(pair.files.flatMap((f) => ('auditId' in f.class ? [f.class.auditId] : [])))],
      }
    }
  }

  writeFileSync(join(outDir, 'residuals.json'), JSON.stringify(results, null, 1))

  let covered = 0
  let total = 0
  const problem: string[] = []
  for (const [chain, contracts] of Object.entries(results)) {
    for (const [key, r] of Object.entries(contracts)) {
      total++
      if ((r as { fullyCovered: boolean }).fullyCovered) covered++
      else problem.push(`${chain}/${key}`)
    }
  }
  console.log(`\nresiduals: ${covered}/${total} contracts fully audit-covered`)
  if (problem.length) console.log(`with residuals: ${problem.slice(0, 40).join(', ')}${problem.length > 40 ? ' …' : ''}`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
