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
 * Read from the source node rather than the rendered output, so marks and
 * nested components can't distort the result, and stega metadata is stripped
 * rather than accidentally slugified.
 */
export function blockText(block: PortableTextBlock): string {
  if (!Array.isArray(block?.children)) return ''
  return stegaClean(
    block.children.map((child) => (typeof child.text === 'string' ? child.text : '')).join(''),
  )
}
