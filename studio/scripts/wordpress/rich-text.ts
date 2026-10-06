/**
 * HTML → the Studio's Rich Text, plus the small text helpers the rest of the
 * import uses: block keys, plain text from HTML, and links.
 */
import {randomBytes} from 'node:crypto'
import {JSDOM} from 'jsdom'
import {htmlToPortableText} from '@portabletext/html'
import {compileSchema, defineSchema} from '@portabletext/schema'
import {imageField} from './images'
import {site, type Obj} from './options'

/** A new _key for an item in a list. */
export const key = () => randomBytes(6).toString('hex')

/** The text in some HTML, entities decoded: "Tom &amp; Jerry" → "Tom & Jerry". */
export const decode = (html: string) => new JSDOM(`<!doctype html><body>${html}`).window.document.body.textContent?.trim() ?? ''

/** Links to the old site as paths (/contact-us/), so they keep working on the new one. */
export function localHref(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url, site.url)
    const sameSite = parsed.hostname.replace(/^www\./, '') === new URL(site.url).hostname.replace(/^www\./, '')
    return sameSite ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.href
  } catch {
    return url
  }
}

/** A link field (pageSlug for the site's own pages, else linkExternal) from an Elementor link setting. */
export function linkItems(link: Obj | undefined, title: string): Obj[] {
  const href = localHref(link?.url)
  if (!href) return []
  if (href.startsWith('/')) return [{_type: 'pageSlug', _key: key(), title, slug: href}]
  return [{_type: 'linkExternal', _key: key(), title, url: href, openInNewTab: Boolean(link?.is_external)}]
}

/** The Studio's Rich Text (schemaTypes/objects/rich-text.ts), for the HTML converter. */
const richTextSchema = compileSchema(
  defineSchema({
    styles: ['normal', 'h1', 'h2', 'h3', 'h4', 'blockquote'].map((name) => ({name})),
    lists: [{name: 'bullet'}, {name: 'number'}],
    decorators: ['strong', 'em', 'underline', 'strike-through'].map((name) => ({name})),
    annotations: [{name: 'link', fields: [{name: 'href', type: 'string'}]}],
    blockObjects: [{name: 'image', fields: [{name: 'src', type: 'string'}, {name: 'alt', type: 'string'}]}],
  }),
)

/**
 * HTML → Rich Text. Headings h5/h6 become h4 (the Studio stops at h4), body
 * text uses "Paragraph" (the 18px style editors use for body copy) while list
 * items stay "Normal" (lists set their own size, PtList.astro), links to the
 * old site become paths, images are uploaded, and empty paragraphs are dropped.
 */
export async function richText(html: string | undefined): Promise<Obj[]> {
  if (!html?.trim()) return []
  const blocks = htmlToPortableText(html.replace(/<(\/?)h[56]\b/gi, '<$1h4'), {
    schema: richTextSchema,
    keyGenerator: key,
    parseHtml: (source) => new JSDOM(source).window.document,
    whitespaceMode: 'normalize',
    types: {
      image: ({context, value}) => ({_type: 'image', _key: context.keyGenerator(), src: value.src, alt: value.alt}),
    },
  }) as Obj[]

  const out: Obj[] = []
  for (const block of blocks) {
    if (block._type === 'image') {
      const image = await imageField(block.src, block.alt)
      if (image) out.push({...image, _key: block._key})
      continue
    }
    if (block._type !== 'block') continue
    if (block.style === 'normal' && !block.listItem) block.style = 'paragraph'
    for (const def of block.markDefs ?? []) {
      if (def._type === 'link') def.href = localHref(def.href)
    }
    const text = (block.children ?? []).map((c: Obj) => c.text ?? '').join('').trim()
    if (!text && !block.listItem) continue
    out.push(block)
  }
  return out
}

/** Plain text with a blank line between paragraphs (how ACF keeps it) → Rich Text. */
export const paragraphs = (text: string) =>
  richText(/<p[\s>]/.test(text) ? text : text.split(/\n\s*\n/).map((p) => `<p>${p.trim()}</p>`).join(''))

/** A Rich Text block holding `content`, or null when there's none. */
export const richTextBlock = (content: Obj[]) => (content.length ? {_type: 'richTextBlock', _key: key(), content} : null)
