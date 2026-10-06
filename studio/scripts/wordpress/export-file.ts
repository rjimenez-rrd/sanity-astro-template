/**
 * Reads a WordPress export (Tools → Export → All content, a WXR file) into
 * plain items: one per published page, News post, case result, attorney or
 * testimonial, with what the import
 * uses from its custom fields, terms and attachments already looked up.
 */
import {readFileSync} from 'node:fs'
import {JSDOM} from 'jsdom'
import {DEFAULT_LANGUAGE} from './options'
import {ACF, NEWS_TAXONOMIES, NEWS_TYPES, RECORD_TYPES} from './site-mappings'

export interface WpItem {
  id: number
  slug: string
  /** The parent page's id, or 0. */
  parent: number
  /** As WordPress stores them: HTML entities and all. */
  title: string
  content: string
  excerpt: string
  /** "2024-01-02T03:04:05", local time; dateGmt the same in UTC. Empty when unset. */
  date: string
  dateGmt: string
  language: string
  /** Every language version, this one included, by language: {en: 20, es: 2584}. */
  translations: Record<string, number>
  /** Elementor's layout (JSON), when the page was built with Elementor. */
  elementorData?: string
  /** Its Page Types, Locations and categories, by slug. */
  pageTypes: string[]
  locations: string[]
  categories: string[]
  featuredImage?: {url: string; alt: string}
  /** From Yoast SEO. */
  seo: {title?: string; description?: string; imageUrl?: string; noIndex?: boolean}
  /** From ACF (site-mappings.ts). */
  introText?: string
  relatedPageIds: number[]
  /** Every custom field with a value (ACF and others), by name: a case result's amount, an attorney's position, ... */
  fields: Record<string, string>
}

export interface WpCategory {
  id: number
  slug: string
  name: string
}

export interface WpExport {
  siteUrl: string
  pages: WpItem[]
  posts: WpItem[]
  categories: WpCategory[]
  caseResults: WpItem[]
  attorneys: WpItem[]
  testimonials: WpItem[]
}

/** "2024-01-02 03:04:05" → "2024-01-02T03:04:05"; WordPress's "0000-…" (never set) → "". */
const isoDate = (value: string) => (value && !value.startsWith('0000') ? value.replace(' ', 'T') : '')

/** The page ids in a PHP-serialized list, e.g. a:2:{i:0;s:3:"276";i:1;s:3:"397";}. */
const serializedIds = (value = '') =>
  [...value.matchAll(/s:\d+:"(\d+)"|i:\d+;i:(\d+)/g)].map((m) => Number(m[1] ?? m[2]))

/** A /es/... address's language, for when no translation plugin says. */
function languageFromAddress(link: string) {
  try {
    return new URL(link).pathname.match(/^\/([a-z]{2})\//)?.[1]
  } catch {
    return undefined
  }
}

export function readExport(file: string): WpExport {
  const doc = new JSDOM(readFileSync(file, 'utf8'), {contentType: 'text/xml'}).window.document
  const text = (el: Element | Document, tag: string) => el.getElementsByTagName(tag)[0]?.textContent ?? ''

  // Regular post categories, and the News type's own taxonomy (a wp:term).
  const categories: WpCategory[] = [
    ...Array.from(doc.getElementsByTagName('wp:category')).map((c) => ({
      id: Number(text(c, 'wp:term_id')),
      slug: text(c, 'wp:category_nicename'),
      name: text(c, 'wp:cat_name'),
    })),
    ...Array.from(doc.getElementsByTagName('wp:term'))
      .filter((t) => NEWS_TAXONOMIES.includes(text(t, 'wp:term_taxonomy')))
      .map((t) => ({id: Number(text(t, 'wp:term_id')), slug: text(t, 'wp:term_slug'), name: text(t, 'wp:term_name')})),
  ]

  const raw = Array.from(doc.getElementsByTagName('item')).map((el) => {
    const meta: Record<string, string> = {}
    for (const pm of Array.from(el.getElementsByTagName('wp:postmeta'))) {
      meta[text(pm, 'wp:meta_key')] = text(pm, 'wp:meta_value')
    }
    const terms = Array.from(el.getElementsByTagName('category')).map((c) => ({
      taxonomy: c.getAttribute('domain') ?? '',
      slug: c.getAttribute('nicename') ?? '',
    }))
    const termsIn = (taxonomies: string[]) => terms.filter((t) => taxonomies.includes(t.taxonomy)).map((t) => t.slug)
    return {el, meta, termsIn, type: text(el, 'wp:post_type'), status: text(el, 'wp:status'), id: Number(text(el, 'wp:post_id'))}
  })

  const attachments = new Map(
    raw.filter((r) => r.type === 'attachment').map((r) => [r.id, {url: text(r.el, 'wp:attachment_url'), alt: r.meta._wp_attachment_image_alt ?? ''}]),
  )

  const toItem = (r: (typeof raw)[number]): WpItem & {translationSet?: string} => {
    const {el, meta, termsIn} = r
    const yoastTitle = meta._yoast_wpseo_title
    return {
      id: r.id,
      slug: text(el, 'wp:post_name'),
      parent: Number(text(el, 'wp:post_parent')) || 0,
      title: text(el, 'title'),
      content: text(el, 'content:encoded'),
      excerpt: text(el, 'excerpt:encoded'),
      date: isoDate(text(el, 'wp:post_date')),
      dateGmt: isoDate(text(el, 'wp:post_date_gmt')),
      // Polylang's language term, else the address.
      language: (termsIn(['language'])[0] || languageFromAddress(text(el, 'link')) || DEFAULT_LANGUAGE).slice(0, 2).toLowerCase(),
      translations: {},
      translationSet: termsIn(['post_translations'])[0],
      elementorData: meta._elementor_data || undefined,
      pageTypes: termsIn(['page-type']),
      locations: termsIn(['location']),
      categories: termsIn(NEWS_TAXONOMIES),
      featuredImage: attachments.get(Number(meta._thumbnail_id)),
      seo: {
        // Yoast's %%title%%-style templates only make sense inside WordPress.
        title: yoastTitle && !yoastTitle.includes('%%') ? yoastTitle : undefined,
        description: meta._yoast_wpseo_metadesc || undefined,
        imageUrl: meta['_yoast_wpseo_opengraph-image'] || undefined,
        noIndex: meta['_yoast_wpseo_meta-robots-noindex'] === '1' || undefined,
      },
      introText: meta[ACF.intro]?.trim() || undefined,
      relatedPageIds: serializedIds(meta[ACF.relatedPages]),
      // WordPress's own fields start with _; the rest are the site's custom fields.
      fields: Object.fromEntries(Object.entries(meta).filter(([k, v]) => !k.startsWith('_') && v.trim())),
    }
  }

  const published = (type: string) => raw.filter((r) => r.type === type && r.status === 'publish').map(toItem)
  const pages = published('page')
  const posts = NEWS_TYPES.flatMap(published)
  // Records (case results, attorneys, testimonials) count when any of their
  // language versions is published: an attorney whose English page is still
  // a draft but whose Spanish one is live is still on the site.
  const records = (type: string) => {
    const all = raw.filter((r) => r.type === type && (r.status === 'publish' || r.status === 'draft'))
    const liveSets = new Set(all.filter((r) => r.status === 'publish').map((r) => r.termsIn(['post_translations'])[0]).filter(Boolean))
    return all
      .filter((r) => r.status === 'publish' || liveSets.has(r.termsIn(['post_translations'])[0]))
      .map(toItem)
  }
  const caseResults = records(RECORD_TYPES.caseResults)
  const attorneys = records(RECORD_TYPES.attorneys)
  const testimonials = records(RECORD_TYPES.testimonials)

  // Polylang's translation sets: the versions of a page share a set, so each
  // lists all of them.
  for (const list of [pages, posts, caseResults, attorneys, testimonials]) {
    const sets = new Map<string, WpItem[]>()
    for (const item of list) if (item.translationSet) sets.set(item.translationSet, [...(sets.get(item.translationSet) ?? []), item])
    for (const set of sets.values()) {
      for (const item of set) item.translations = Object.fromEntries(set.map((s) => [s.language, s.id]))
    }
  }

  return {
    siteUrl: (text(doc, 'wp:base_blog_url') || text(doc, 'link')).replace(/\/+$/, ''),
    pages,
    posts,
    categories,
    caseResults,
    attorneys,
    testimonials,
  }
}
