import {useMemo} from 'react'
import type {ArrayOfObjectsInputProps, OnPasteFn, PortableTextInputProps} from 'sanity'
import {htmlToPortableText} from '@portabletext/html'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'

type Block = {
  _type: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: unknown[]
  markDefs?: unknown[]
}

// Heading-like styles only carry over to the first pasted paragraph: pasting
// a whole article over a heading shouldn't turn every paragraph into one.
const SINGLE_BLOCK_STYLES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'])

/**
 * Rich text with "paste and match style". Text pasted from anywhere (a web
 * page, Word, Google Docs) arrives as plain paragraphs, which the editor files
 * as Normal — so selecting a Paragraph or a heading and pasting over it turned
 * it into Normal. Here pasted paragraphs take the style (and list) of the
 * block they're pasted into, and keep their bold, italic and links.
 *
 * Pasting into a Normal block, and copying within the Studio (which carries
 * its own styles), keep the editor's usual paste.
 */
export function RichTextInput(arrayProps: ArrayOfObjectsInputProps) {
  // A rich-text (block) array is always handed Portable Text input props.
  const props = arrayProps as unknown as PortableTextInputProps
  const schema = useMemo(
    // The bridge is typed against its own copy of Sanity's types; same shape.
    () => sanitySchemaToPortableTextSchema(props.schemaType as Parameters<typeof sanitySchemaToPortableTextSchema>[0]),
    [props.schemaType],
  )

  const onPaste: OnPasteFn = ({event, path, value}) => {
    const data = event.clipboardData
    if (!data) return undefined
    // Copied from a Studio editor: it already has the right styles.
    if (Array.from(data.types).some((t) => t.includes('portable-text'))) return undefined

    const key = (path[0] as {_key?: string} | undefined)?._key
    const target = (value as Block[] | undefined)?.find((b) => b._key === key)
    if (!target || target._type !== 'block' || !target.style || target.style === 'normal') return undefined

    const html = data.getData('text/html')
    const text = data.getData('text/plain')
    const pasted: Block[] = html
      ? (htmlToPortableText(html, {
          schema,
          parseHtml: (h) => new DOMParser().parseFromString(h, 'text/html'),
        }) as Block[])
      : text
          .split(/\r?\n/)
          .filter((line) => line.trim() !== '')
          .map((line) => ({
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [{_type: 'span', text: line, marks: []}],
          }))
    if (pasted.length === 0) return undefined

    let first = true
    const insert = pasted.map((block) => {
      if (block._type !== 'block') return block
      const restyle = (!block.style || block.style === 'normal') && (first || !SINGLE_BLOCK_STYLES.has(target.style!))
      first = false
      return {
        ...block,
        ...(restyle && {style: target.style}),
        ...(target.listItem && !block.listItem && {listItem: target.listItem, level: target.level ?? 1}),
      }
    })
    return {insert}
  }

  return props.renderDefault({...props, onPaste})
}
