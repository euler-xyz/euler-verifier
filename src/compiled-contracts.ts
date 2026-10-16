import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fromHex } from './metadata.js'
import type { CompiledContract } from './bytecode.js'

interface ContractNode {
  nodeType?: string
  id?: number
  name?: string
  contractDependencies?: number[]
}

/** The fields of a forge artifact built with `--ast` that tell which contracts it embeds. */
export interface ForgeArtifact {
  bytecode?: { object?: string }
  deployedBytecode?: { object?: string }
  metadata?: unknown
  ast?: { absolutePath?: string; nodes?: ContractNode[] }
}

interface Entry {
  creation?: string
  runtime?: string
  dependencies: number[]
}

/** One compiler run: its contracts by `path:name` and its AST ids; null where two artifacts disagree. */
interface Unit {
  contracts: Map<string, Entry | null>
  ids: Map<number, string | null>
}

export type BuildIndex = Map<string, Unit>

function parsedMetadata(raw: unknown): { compiler?: { version?: string }; settings?: Record<string, unknown> } {
  if (typeof raw !== 'string') return (raw ?? {}) as ReturnType<typeof parsedMetadata>
  try {
    return JSON.parse(raw) as ReturnType<typeof parsedMetadata>
  } catch {
    return {}
  }
}

/** Whether the artifact's metadata embeds source contents rather than their hashes. */
export function usesLiteralContent(artifact: ForgeArtifact): boolean {
  const { settings } = parsedMetadata(artifact.metadata)
  return (settings?.metadata as { useLiteralContent?: boolean } | undefined)?.useLiteralContent === true
}

/** The compiler run an artifact came from (AST ids are unique only within one) and its `path:name`. */
function identify(artifact: ForgeArtifact): { unit: string; label: string } | null {
  const { compiler, settings } = parsedMetadata(artifact.metadata)
  const { compilationTarget, ...shared } = settings ?? {}
  const targets = Object.entries((compilationTarget ?? {}) as Record<string, string>)
  if (!compiler?.version || targets.length !== 1) return null
  const [path, name] = targets[0]!
  const unit = createHash('sha1').update(`${compiler.version}|${JSON.stringify(shared)}`).digest('hex')
  return { unit, label: `${path}:${name}` }
}

function hexCode(object: string | undefined): string | undefined {
  const hex = object?.replace(/^0x/, '')
  return hex && /^[0-9a-fA-F]+$/.test(hex) ? hex.toLowerCase() : undefined
}

function record<K, V>(map: Map<K, V | null>, key: K, value: V, same: (a: V, b: V) => boolean): void {
  const existing = map.get(key)
  map.set(key, existing === undefined || (existing !== null && same(existing, value)) ? value : null)
}

const sameEntry = (a: Entry, b: Entry) =>
  a.creation === b.creation && a.runtime === b.runtime && a.dependencies.join(',') === b.dependencies.join(',')

function contractNodes(artifact: ForgeArtifact): Array<ContractNode & { id: number; name: string }> {
  return (artifact.ast?.nodes ?? []).filter(
    (n): n is ContractNode & { id: number; name: string } =>
      n.nodeType === 'ContractDefinition' && typeof n.id === 'number' && typeof n.name === 'string',
  )
}

function dependenciesOf(artifact: ForgeArtifact, label: string): number[] {
  const path = artifact.ast?.absolutePath
  return contractNodes(artifact).find((n) => `${path}:${n.name}` === label)?.contractDependencies ?? []
}

/** Index a build's artifacts. Artifacts without an AST or a single compilation target are left out. */
export function indexBuild(artifacts: ForgeArtifact[]): BuildIndex {
  const index: BuildIndex = new Map()
  for (const artifact of artifacts) {
    const at = identify(artifact)
    const path = artifact.ast?.absolutePath
    if (!at || !path) continue
    const unit = index.get(at.unit) ?? { contracts: new Map(), ids: new Map() }
    index.set(at.unit, unit)
    for (const n of contractNodes(artifact)) record(unit.ids, n.id, `${path}:${n.name}`, (a, b) => a === b)
    const entry = {
      creation: hexCode(artifact.bytecode?.object),
      runtime: hexCode(artifact.deployedBytecode?.object),
      dependencies: dependenciesOf(artifact, at.label),
    }
    record(unit.contracts, at.label, entry, sameEntry)
  }
  return index
}

/**
 * Every artifact under a forge `out/` directory, build-info excluded. AST ids
 * identify contracts only in a clean build: one compiler run per version and
 * settings.
 */
export function readBuildIndex(outDir: string): BuildIndex {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry)
      if (statSync(p).isDirectory()) {
        if (entry !== 'build-info') walk(p)
      } else if (entry.endsWith('.json')) files.push(p)
    }
  }
  if (existsSync(outDir)) walk(outDir)
  return indexBuild(files.sort().map((f) => JSON.parse(readFileSync(f, 'utf8')) as ForgeArtifact))
}

/**
 * `artifact` with the contracts the compiler reports it embeds (`contractDependencies`), recursively.
 * A dependency the index cannot resolve unambiguously is left out, so nothing of it is masked.
 */
export function compiledContract(index: BuildIndex, artifact: ForgeArtifact): CompiledContract {
  const at = identify(artifact)
  const unit = at ? index.get(at.unit) : undefined
  const built = new Map<string, CompiledContract | null>()
  const bytes = (hex: string | undefined) => (hex ? fromHex(hex) : undefined)

  const embeds = (dependencies: number[], visiting: ReadonlySet<string>): CompiledContract[] =>
    dependencies.flatMap((id) => {
      const label = unit?.ids.get(id)
      const child = label ? resolve(label, visiting) : null
      return child ? [child] : []
    })
  const resolve = (label: string, visiting: ReadonlySet<string>): CompiledContract | null => {
    if (visiting.has(label)) return null
    if (built.has(label)) return built.get(label)!
    const entry = unit?.contracts.get(label)
    const contract = entry
      ? { creation: bytes(entry.creation), runtime: bytes(entry.runtime), embeds: embeds(entry.dependencies, new Set([...visiting, label])) }
      : null
    built.set(label, contract)
    return contract
  }

  return {
    creation: bytes(hexCode(artifact.bytecode?.object)),
    runtime: bytes(hexCode(artifact.deployedBytecode?.object)),
    embeds: at ? embeds(dependenciesOf(artifact, at.label), new Set([at.label])) : [],
  }
}
