/**
 * Dev-only: a block's fields as the Studio defines them, read from
 * studio/schema.json — the schema `npm run typegen` extracts (gitignored, so
 * it's as current as the last typegen run). It records each field's name,
 * type, whether it's required and the values a list allows; not the labels
 * editors see, which live only in the schema file itself.
 */
import fs from 'node:fs'
import path from 'node:path'

export interface BlockField {
  name: string
  type: string
  required: boolean
}

export interface BlockFields {
  fields: BlockField[]
  /** The block's schema file, e.g. studio/schemaTypes/blocks/link-list.ts, when it's where the naming convention puts it. */
  file: string | null
}

type Node = {
  type: string
  value?: Node | string | number
  of?: Node | Node[]
  name?: string
  attributes?: Record<string, {value: Node; optional?: boolean}>
  /** An array item: its _key, plus the type it spreads in. */
  rest?: Node
}

const STUDIO = path.resolve(process.cwd(), '../studio')

let schema: Array<{name: string; value: Node}> | null | undefined
function load() {
  if (schema !== undefined) return schema
  try {
    schema = JSON.parse(fs.readFileSync(path.join(STUDIO, 'schema.json'), 'utf8'))
  } catch {
    schema = null
  }
  return schema
}

/** A fixed value from a list of options ("manual", 3), as opposed to a type. */
const literal = (node: Node) =>
  (node.type === 'string' || node.type === 'number') && (typeof node.value === 'string' || typeof node.value === 'number')

/** A field's type in a line: "string", "one of: manual | practiceAreas", "array of reference → page | reference → practiceArea". */
function describe(node: Node): string {
  switch (node.type) {
    case 'string':
    case 'number':
    case 'boolean':
      return literal(node) ? String(node.value) : node.type
    case 'union': {
      const options = node.of as Node[]
      const text = options.map(describe).join(' | ')
      return options.every(literal) ? `one of: ${text}` : text
    }
    case 'array':
      return `array of ${describe(node.of as Node)}`
    case 'inline':
      return node.name?.endsWith('.reference') ? `reference → ${node.name.slice(0, -'.reference'.length)}` : (node.name ?? 'inline')
    case 'object': {
      // An array item is { _key } plus the type it spreads in. A spread object
      // merges into this one; a spread named type is that type.
      if (node.rest?.type === 'object') {
        return describe({...node.rest, attributes: {...node.rest.attributes, ...node.attributes}})
      }
      const own = Object.keys(node.attributes ?? {}).filter((k) => !k.startsWith('_'))
      if (node.rest) return own.length ? `${describe(node.rest)} + { ${own.join(', ')} }` : describe(node.rest)
      // Named by its _type when it has one: gridColumn { label, content, … }.
      const typeValue = node.attributes?._type?.value
      const name = typeValue && literal(typeValue) ? String(typeValue.value) : 'object'
      return own.length ? `${name} { ${own.join(', ')} }` : name
    }
    default:
      return node.type
  }
}

/** linkList → link-list. */
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** The fields of a block _type, or null when schema.json is missing or doesn't have it. */
export function blockFields(type: string): BlockFields | null {
  const entry = load()?.find((t) => t.name === type)
  if (!entry || entry.value.type !== 'object') return null
  const fields = Object.entries(entry.value.attributes ?? {})
    .filter(([name]) => !name.startsWith('_'))
    .map(([name, attr]) => ({name, type: describe(attr.value), required: !attr.optional}))
  const file = `schemaTypes/blocks/${kebab(type)}.ts`
  return {fields, file: fs.existsSync(path.join(STUDIO, file)) ? `studio/${file}` : null}
}
