import { execFileSync } from 'node:child_process'

/**
 * The commit of the engine checkout at `root`, so a rendered report names the
 * code and notes that produced it; marked `-dirty` when the checkout has
 * uncommitted changes, undefined outside git.
 */
export function engineRef(root: string): string | undefined {
  const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  try {
    const head = git('rev-parse', 'HEAD')
    return git('status', '--porcelain') ? `${head}-dirty` : head
  } catch {
    return undefined
  }
}
