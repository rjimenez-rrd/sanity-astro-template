/**
 * Dev-only: every component under src/components, read from disk when the
 * codebase map loads, so the list is never out of date. Each gets the first
 * sentence of its top comment; a page builder block also gets its _type
 * (blockRegistry.ts), its Studio schema file and the name editors see there.
 */
import fs from 'node:fs'
import path from 'node:path'

export interface ComponentEntry {
  /** Path from src/, e.g. components/ui/PhoneLink.astro. */
  file: string
  name: string
  summary: string | null
  /** The components it imports, e.g. CardCarousel for LawyerCards: found by the search too. */
  uses: string[]
  block?: {type: string; title: string | null; schema: string | null}
}

export interface ComponentGroup {
  folder: string
  components: ComponentEntry[]
}

const SRC = path.resolve(process.cwd(), 'src')
const STUDIO = path.resolve(process.cwd(), '../studio')

function walk(dir: string): string[] {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(astro|ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

/**
 * The first sentence of a file's leading /** comment (in the frontmatter for
 * .astro): one before its code starts, after any imports. A comment further
 * down describes a prop or a helper, not the file.
 */
function summary(source: string): string | null {
  const head = source.startsWith('---') ? source.slice(3, source.indexOf('\n---', 3)) : source
  const match = head.match(/\/\*\*([\s\S]*?)\*\//)
  if (!match || match.index === undefined) return null
  const code = head.search(/^(interface|type|const|let|function|class|export)\b/m)
  if (code >= 0 && code < match.index) return null
  const text = match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Up to the first full stop that ends a sentence, not one inside a name like lib/x.ts.
  const end = text.search(/\.(\s|$)/)
  const sentence = end > 0 ? text.slice(0, end + 1) : text
  return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence || null
}

/** Component import name → _type, from blockRegistry.ts's BLOCK_COMPONENTS. */
function blockTypes(): Map<string, string> {
  const registry = fs.readFileSync(path.join(SRC, 'components/page-builder/blockRegistry.ts'), 'utf8')
  const imports = new Map([...registry.matchAll(/import (\w+) from '\.\/blocks\/(\w+)\.astro'/g)].map((m) => [m[1], m[2]]))
  const body = registry.slice(registry.indexOf('BLOCK_COMPONENTS'))
  const types = new Map<string, string>()
  for (const [, type, component] of body.matchAll(/^\s*(\w+): (\w+),?$/gm)) {
    const file = imports.get(component)
    if (file) types.set(file, type)
  }
  return types
}

/** The block's schema file and its defineType title, when the naming convention finds it. */
function studioBlock(type: string): {title: string | null; schema: string | null} {
  const rel = `schemaTypes/blocks/${type.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.ts`
  const full = path.join(STUDIO, rel)
  if (!fs.existsSync(full)) return {title: null, schema: null}
  const source = fs.readFileSync(full, 'utf8')
  const title = source.slice(source.indexOf('defineType(')).match(/title:\s*'([^']+)'/)
  return {title: title?.[1] ?? null, schema: `studio/${rel}`}
}

export function componentIndex(): ComponentGroup[] {
  const types = blockTypes()
  const entries = walk(path.join(SRC, 'components'))
    .map((full): ComponentEntry => {
      const file = path.relative(SRC, full).split(path.sep).join('/')
      const name = path.basename(full)
      const source = fs.readFileSync(full, 'utf8')
      const uses = [...source.matchAll(/^import (\w+) from '[^']+\.astro'/gm)].map((m) => m[1])
      const entry: ComponentEntry = {file, name, summary: summary(source), uses}
      const type = file.startsWith('components/page-builder/blocks/') ? types.get(name.replace(/\.astro$/, '')) : undefined
      if (type) entry.block = {type, ...studioBlock(type)}
      return entry
    })
    .sort((a, b) => a.file.localeCompare(b.file))

  const groups = new Map<string, ComponentEntry[]>()
  for (const entry of entries) {
    const folder = path.posix.dirname(entry.file)
    groups.set(folder, [...(groups.get(folder) ?? []), entry])
  }
  return [...groups].map(([folder, components]) => ({folder, components}))
}
