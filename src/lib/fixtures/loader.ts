import { readFile } from 'fs/promises'
import { resolve, relative, isAbsolute, normalize } from 'path'

const FIXTURES_DIR = resolve(process.cwd(), 'fixtures')

// Guards against path traversal with two layers:
// 1. Upfront rejection of absolute paths and any '..' segments in the input.
// 2. Post-resolve check via path.relative() — if the computed relative path
//    starts with '..' or is absolute, the input escaped FIXTURES_DIR.
// Returns null on violation so callers fall through to default fixture values.
function safeResolvePath(relativePath: string): string | null {
  if (isAbsolute(relativePath)) return null
  const segments = normalize(relativePath).split(/[\\/]/)
  if (segments.some((s) => s === '..')) return null

  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
  const resolved = resolve(FIXTURES_DIR, relativePath)
  const rel = relative(FIXTURES_DIR, resolved)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  return resolved
}

/**
 * Type-safe fixture loader. Returns null if fixture file doesn't exist.
 * All fixture files are JSON — shaped against real API response schemas.
 */
export async function loadFixture<T>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = safeResolvePath(relativePath)
    if (!fullPath) return null
    const raw = await readFile(fullPath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function loadAllFixtures<T>(dir: string): Promise<Array<T & { _filename: string }>> {
  const { readdir } = await import('fs/promises')
  try {
    const safeDirPath = safeResolvePath(dir)
    if (!safeDirPath) return []
    const files = await readdir(safeDirPath)
    const items = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const data = await loadFixture<T>(`${normalize(dir)}/${file}`)
          if (data === null) return null
          return Object.assign({}, data, { _filename: file }) as T & { _filename: string }
        })
    )
    // Cast is safe: Promise.all result is (T & { _filename: string } | null)[] and we filter nulls
    return items.filter(Boolean) as (T & { _filename: string })[]
  } catch {
    return []
  }
}
