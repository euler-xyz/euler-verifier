/**
 * verify/manifest.json is written as Python's
 * `json.dumps(obj, indent=1, ensure_ascii=True, sort_keys=True) + "\n"`.
 * JSON.stringify can't reproduce it: JS objects enumerate integer-like keys
 * ("1", "56", "130") numerically, while the file orders them as strings.
 */
export function formatManifest(value: unknown): string {
  return `${serialize(value, '')}\n`
}

function serialize(value: unknown, indent: string): string {
  const inner = `${indent} `
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[\n${value.map((v) => inner + serialize(v, inner)).join(',\n')}\n${indent}]`
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    if (keys.length === 0) return '{}'
    const fields = keys.map((k) => `${inner}${asciiJson(k)}: ${serialize((value as Record<string, unknown>)[k], inner)}`)
    return `{\n${fields.join(',\n')}\n${indent}}`
  }
  return typeof value === 'string' ? asciiJson(value) : JSON.stringify(value)
}

function asciiJson(text: string): string {
  return JSON.stringify(text).replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}
