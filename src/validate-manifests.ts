#!/usr/bin/env tsx
/**
 * Manifest validators (plan §2.2/§2.5): SHA-only pins, schema shape, waiver
 * discipline, audits.json integrity. Exits non-zero on any violation — this
 * is the gate that makes branch pins and malformed entries unmergeable.
 *
 *   pnpm tsx src/validate-manifests.ts --manifest <file> [--audits <file>] [--baselines <file>]
 */
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'

const SHA_RE = /^[0-9a-f]{40}$/

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const REPO_RE = /^euler-xyz\/[\w.-]+$/
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

/** A path below the repository root, without `.`, `..` or empty segments. */
const isSubmodulePath = (path: string) =>
  !posix.isAbsolute(path) && path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')

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
      if ('address' in e) fail(`${where}: address overrides are not allowed; addresses come from euler-interfaces`)
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
      const evidence = e.evidence as { submoduleOverrides?: Array<{ path?: string; ref?: string }>; address?: string } | undefined
      const overridden = (evidence?.submoduleOverrides ?? []).map((o) => o.path ?? '')
      overridden.forEach((path, i) => {
        const inside = overridden.slice(0, i).find((earlier) => earlier.startsWith(`${path}/`))
        if (overridden.indexOf(path) !== i) fail(`${where}: submodule override ${path} is listed twice`)
        else if (inside) fail(`${where}: submodule override ${path} comes after ${inside} inside it; list parents first`)
      })
      for (const o of evidence?.submoduleOverrides ?? []) {
        if (!o.path) fail(`${where}: submodule override without a path`)
        else if (!isSubmodulePath(o.path)) fail(`${where}: submodule override path "${o.path}" is not a repo-relative submodule path`)
        if (!o.ref || !SHA_RE.test(o.ref)) fail(`${where}: submodule override ${o.path} ref "${o.ref}" is not a full 40-hex SHA`)
      }
      if (evidence?.address !== undefined && !ADDRESS_RE.test(evidence.address)) fail(`${where}: evidence.address is not an address`)
      const proxy = e.proxy as { address?: string; implementation?: string } | undefined
      if (proxy && (!ADDRESS_RE.test(proxy.address ?? '') || !ADDRESS_RE.test(proxy.implementation ?? ''))) {
        fail(`${where}: proxy needs an address and an implementation address`)
      }
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

interface BaselinePins {
  component: string
  baseline: { commit?: string }
  lastAudit: { finalReviewedCommit?: string }
  pinNotes?: Record<string, unknown>
  libComponents?: Array<{ baseline: { commit?: string }; lastAudit: { finalReviewedCommit?: string } }>
}

function validateBaselines(path: string): void {
  const { components } = JSON.parse(readFileSync(path, 'utf8')) as { components: BaselinePins[] }
  for (const c of components) {
    const pins: Array<[string, string | undefined]> = [
      ['baseline.commit', c.baseline.commit],
      ['lastAudit.finalReviewedCommit', c.lastAudit.finalReviewedCommit],
      ...Object.keys(c.pinNotes ?? {}).map((pin): [string, string] => [`pinNotes ${pin}`, pin]),
      ...(c.libComponents ?? []).flatMap((lib): Array<[string, string | undefined]> => [
        ['libComponents baseline.commit', lib.baseline.commit],
        ['libComponents lastAudit.finalReviewedCommit', lib.lastAudit.finalReviewedCommit],
      ]),
    ]
    for (const [field, pin] of pins) {
      if (!pin || !SHA_RE.test(pin)) fail(`baselines ${c.component}: ${field} "${pin}" is not a full 40-hex SHA`)
    }
  }
}

const { values } = parseArgs({
  options: { manifest: { type: 'string' }, audits: { type: 'string' }, baselines: { type: 'string' } },
})
if (!values.manifest && !values.audits && !values.baselines) {
  console.error('usage: validate-manifests [--manifest file] [--audits file] [--baselines file]')
  process.exit(1)
}
if (values.manifest) validateManifest(resolve(values.manifest))
if (values.audits) validateAudits(resolve(values.audits))
if (values.baselines) validateBaselines(resolve(values.baselines))

if (errors.length) {
  console.error(`${errors.length} validation error(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('manifests valid')
