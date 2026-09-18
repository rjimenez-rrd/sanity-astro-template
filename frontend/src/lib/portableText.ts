import {stegaClean} from '@sanity/client/stega'
import type {PortableTextBlock} from '@portabletext/types'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Plain text of a block, read straight off its spans.
 *
 * The React version walked the *rendered* children to recover this; going to
 * the source node instead means marks and nested components can't distort the
 * result, and stega metadata is stripped rather than accidentally slugified.
 */
export function blockText(block: PortableTextBlock): string {
  if (!Array.isArray(block?.children)) return ''
  return stegaClean(
    block.children.map((child) => (typeof child.text === 'string' ? child.text : '')).join(''),
  )
}

/** Every heading in a document, in order — used for headings and the ToC. */
export function extractHeadings(
  blocks: PortableTextBlock[] | undefined | null,
  styles: string[] = ['h2', 'h3'],
): Array<{id: string; text: string; level: number}> {
  if (!Array.isArray(blocks)) return []
  return blocks
    .filter((b) => b?._type === 'block' && styles.includes(stegaClean(b.style) ?? ''))
    .map((b) => {
      const text = blockText(b)
      return {id: slugify(text), text, level: Number(stegaClean(b.style)!.slice(1))}
    })
    .filter((h) => h.id.length > 0)
}
