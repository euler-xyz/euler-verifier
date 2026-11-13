import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { engineRef } from '../src/engine-ref.js'
import { footerLine } from '../src/render-text.js'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

describe('the engine commit a report names', () => {
  it('is HEAD for a clean checkout, and marked dirty with uncommitted changes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'verifier-engine-'))
    git(dir, 'init', '-q')
    writeFileSync(join(dir, 'notes.json'), '{}\n')
    git(dir, 'add', '.')
    git(dir, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'a')
    const head = git(dir, 'rev-parse', 'HEAD')
    expect(engineRef(dir)).toBe(head)
    writeFileSync(join(dir, 'notes.json'), '{"x":1}\n')
    expect(engineRef(dir)).toBe(`${head}-dirty`)
    expect(footerLine(engineRef(dir))).not.toContain('/tree/')
  })

  it('is unknown outside a git checkout', () => {
    expect(engineRef(mkdtempSync(join(tmpdir(), 'verifier-nogit-')))).toBeUndefined()
  })
})
