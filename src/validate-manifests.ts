#!/usr/bin/env tsx
/**
 * Manifest validators (plan §2.2/§2.5): SHA-only pins, schema shape, waiver
 * discipline, audits.json integrity. Exits non-zero on any violation — this
 * is the gate that makes branch pins and malformed entries unmergeable.
 *
 *   pnpm tsx src/validate-manifests.ts --manifest <file> [--audits <file>]
 */
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SHA_RE = /^[0-9a-f]{40}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const REPO_RE = /^euler-xyz\/[\w.-]+$/

const errors: string[] = []
const fail = (msg: string) => errors.push(msg)

function validateManifest(path: string): void {
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Record<string, Record<string, unknown>>>
  for (const [chain, contracts] of Object.entries(manifest)) {
    if (!/^\d+$/.test(chain)) fail(`manifest: chain key "${chain}" is not a numeric chain id`)
    for (const [key, e] of Object.entries(contracts)) {
      const where = `manifest ${chain}/${key}`
      const repo = e.repo as string | undefined
      const commit = e.commit as string | undefined
      const waiver = e.waiver as { reason?: string; signed_by?: string; date?: string } | null | undefined

      if (!repo || !REPO_RE.test(repo)) fail(`${where}: bad repo "${repo}"`)
      if (waiver) {
        if (!waiver.reason || !waiver.signed_by || !waiver.date) {
          fail(`${where}: waiver must carry reason, signed_by, date`)
        }
        continue // a waived entry needs no proven pin
      }
      if (e.verified === 'canonical') {
        // Long-established token documented by provenance note instead of a
        // bytecode proof (e.g. mainnet EUL). Needs a note, not a pin.
        if (!e.note || typeof e.note !== 'string') fail(`${where}: canonical entry must carry a note`)
        continue
      }
      if (!commit || !SHA_RE.test(commit)) fail(`${where}: pin "${commit}" is not a full 40-hex SHA (branch/tag pins rejected)`)
      if (!e.contractName || typeof e.contractName !== 'string') fail(`${where}: missing contractName`)
      const profile = e.profile as { solc?: string; optimizer_runs?: number; evm_version?: string } | undefined
      if (!profile?.solc || !/^\d+\.\d+\.\d+$/.test(profile.solc)) fail(`${where}: profile.solc missing/invalid`)
      if (typeof profile?.optimizer_runs !== 'number') fail(`${where}: profile.optimizer_runs missing`)
      if (!profile?.evm_version) fail(`${where}: profile.evm_version missing`)
      if (e.verified !== 'bytecode') fail(`${where}: verified must be "bytecode" for non-waived entries`)
    }
  }
}

function validateAudits(path: string): void {
  const audits = JSON.parse(readFileSync(path, 'utf8')) as Array<Record<string, unknown>>
  const ids = new Set<string>()
  for (const a of audits) {
    const id = a.id as string
    const where = `audits ${id}`
    if (!id) fail('audits: entry without id')
    if (ids.has(id)) fail(`${where}: duplicate id`)
    ids.add(id)
    if (!REPO_RE.test((a.repo as string) ?? '')) fail(`${where}: bad repo`)
    const commits = a.commits as { reviewed?: string; final?: string } | undefined
    for (const which of ['reviewed', 'final'] as const) {
      const c = commits?.[which] ?? ''
      if (c && !SHA_RE.test(c)) fail(`${where}: commits.${which} not 40-hex`)
    }
    if (a.date !== null && !DATE_RE.test((a.date as string) ?? '')) fail(`${where}: bad date`)
    if (!Array.isArray(a.scope)) fail(`${where}: scope must be an array`)
    if (!['high', 'medium', 'low'].includes(a.confidence as string)) fail(`${where}: bad confidence`)
    if (typeof a.signed_off !== 'boolean') fail(`${where}: signed_off must be boolean`)
  }
}

const { values } = parseArgs({
  options: { manifest: { type: 'string' }, audits: { type: 'string' } },
})
if (!values.manifest && !values.audits) {
  console.error('usage: validate-manifests [--manifest file] [--audits file]')
  process.exit(1)
}
if (values.manifest) validateManifest(resolve(values.manifest))
if (values.audits) validateAudits(resolve(values.audits))

if (errors.length) {
  console.error(`${errors.length} validation error(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('manifests valid')
