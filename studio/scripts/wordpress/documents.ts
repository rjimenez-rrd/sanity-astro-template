/**
 * WordPress items → Sanity documents: pages become Pages (or Practice Areas,
 * by their Page Type), News items become News posts with their categories,
 * and each set of language versions is linked as the Translations menu does.
 *
 * Every document's id comes from its WordPress id (wp-page-12, wp-post-34,
 * wp-category-5, wp-translation-...), so importing again updates the same
 * documents and --undo can find them.
 */
import type {WpCategory, WpItem} from './export-file'
import {pageBuilderFor, withoutWorkingFields, type PageContext} from './elementor'
import {imageField} from './images'
import {client, DEFAULT_LANGUAGE, note, options, type Obj} from './options'
import {decode, key, paragraphs} from './rich-text'
import {PRACTICE_AREA_TYPE} from './site-mappings'

/** A page and its documents' place in the result, for linking translations. */
export interface Built {
  docs: Obj[]
  items: WpItem[]
}

// --- Choosing what to import ---------------------------------------------------

/** --slug and --limit: with --limit, that many in the default language plus their translations. */
export function selectItems(items: WpItem[]): WpItem[] {
  const chosen = options.slug ? items.filter((i) => i.slug === options.slug) : items
  if (options.limit === Infinity) return chosen
  const picked = chosen.filter((i) => i.language === DEFAULT_LANGUAGE).slice(0, options.limit)
  const ids = new Set(picked.flatMap((i) => [i.id, ...Object.values(i.translations)]))
  return chosen.filter((i) => ids.has(i.id) || Object.values(i.translations).some((id) => ids.has(id)))
}

// --- Shared fields ------------------------------------------------------------

const title = (item: WpItem) => decode(item.title) || 'Untitled'
const slug = (item: WpItem) => ({_type: 'slug', current: item.slug})

/** The SEO field, from Yoast's title, description, share image and noindex. */
async function seoFor(item: WpItem) {
  const ogImage = await imageField(item.seo.imageUrl)
  const seo = {
    ...(item.seo.title ? {metaTitle: decode(item.seo.title)} : {}),
    ...(item.seo.description ? {metaDescription: decode(item.seo.description)} : {}),
    ...(ogImage ? {ogImage} : {}),
    ...(item.seo.noIndex ? {noIndex: true} : {}),
  }
  return Object.keys(seo).length ? {_type: 'seo', ...seo} : undefined
}

// --- Pages and Practice Areas ---------------------------------------------------

const blocksOf = (row: Obj): Obj[] => row.columns.flatMap((c: Obj) => c.content)
const textIn = (blocks: Obj[]): Obj[] => blocks.filter((b) => b._type === 'richTextBlock').flatMap((b) => b.content)
const isHeading = (b: Obj) => /^h[1-6]$/.test(b.style ?? '')

/**
 * A Practice Area's hero when it has no ACF intro, from its own layout. When
 * the first Container holds the H1, it's the WordPress hero: its paragraphs
 * become the Intro Text, its first button the Hero Button and its image (or
 * background image) the Hero Image, and it's dropped from the body so it
 * doesn't show twice. Otherwise the first paragraph is copied as the intro.
 */
async function heroFromLayout(pageBuilder: Obj[], where: string) {
  const first = pageBuilder[0]
  const firstBlocks = first ? blocksOf(first) : []
  if (first && textIn(firstBlocks).some((b) => b.style === 'h1')) {
    const button = firstBlocks.find((b) => b._type === 'callToAction')
    const image = firstBlocks.find((b) => b._type === 'imageBlock')?.image ?? (first.__background ? await imageField(first.__background) : null)
    return {
      intro: textIn(firstBlocks).filter((b) => b._type === 'block' && !isHeading(b)),
      heroButton: button ? {label: button.label, link: button.link} : undefined,
      heroImage: image ?? undefined,
      body: pageBuilder.slice(1),
    }
  }
  const paragraph = textIn(pageBuilder.flatMap(blocksOf)).find((b) => b._type === 'block' && !isHeading(b) && !b.listItem)
  if (paragraph) note(where, 'Intro Text copied from the first paragraph, which also stays in the body: check it.')
  else note(where, 'No intro text found: write the Intro Text before publishing.')
  return {intro: paragraph ? [{...paragraph, _key: key()}] : [], body: pageBuilder}
}

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function buildPages(all: WpItem[]): Promise<Built> {
  const items = selectItems(all)
  const imported = new Set(items.map((i) => i.id))

  // A Practice Area: its Page Type says so, on it or on any of its
  // translations (Polylang can translate the Page Type itself).
  const practiceAreaIds = new Set(
    items.filter((i) => i.pageTypes.includes(PRACTICE_AREA_TYPE)).flatMap((i) => [i.id, ...Object.values(i.translations)]),
  )

  // Its Office: the WordPress Location matched to Site Settings' offices by name (manhattan → Manhattan).
  const offices: Obj[] = (await client.fetch('*[_id == "siteSettings"][0].footerOffices[]{_key, name}')) ?? []
  const officeOf = (item: WpItem) => offices.find((o) => item.locations.includes(slugify(o.name ?? '')))?._key

  const docs: Obj[] = []
  for (const item of items) {
    const practiceArea = practiceAreaIds.has(item.id)
    const page: PageContext = {where: `${practiceArea ? 'practice area' : 'page'} ${item.slug} (${item.language})`, practiceArea}
    console.log(`  ${page.where}`)

    const pageBuilder = await pageBuilderFor(item, page)
    if (item.parent && !imported.has(item.parent)) {
      note(page.where, `Its parent page (WordPress #${item.parent}) isn't in this import: import it too, or set the Parent Page in the Studio.`)
    }
    const common = {
      _id: `wp-page-${item.id}`,
      language: item.language,
      title: title(item),
      slug: slug(item),
      ...(item.parent ? {parent: {_type: 'reference', _ref: `wp-page-${item.parent}`, _weak: true}} : {}),
      ...(item.dateGmt ? {publishedAt: `${item.dateGmt}Z`} : item.date ? {publishedAt: item.date} : {}),
      seo: await seoFor(item),
    }

    if (!practiceArea) {
      docs.push({...common, _type: 'page', pageBuilder: withoutWorkingFields(pageBuilder)})
      continue
    }

    const hero = item.introText ? {intro: await paragraphs(item.introText), body: pageBuilder} : await heroFromLayout(pageBuilder, page.where)
    const relatedPages = item.relatedPageIds
      .filter((id) => imported.has(id) && id !== item.id)
      .map((id) => ({_type: 'reference', _key: key(), _ref: `wp-page-${id}`, _weak: true}))
    const coverImage = await imageField(item.featuredImage?.url, item.featuredImage?.alt)
    const office = officeOf(item)

    docs.push({
      ...common,
      _type: 'practiceArea',
      ...(office ? {location: office} : {}),
      intro: hero.intro,
      ...('heroButton' in hero && hero.heroButton ? {heroButton: hero.heroButton} : {}),
      ...('heroImage' in hero && hero.heroImage ? {heroImage: hero.heroImage} : {}),
      ...(relatedPages.length ? {relatedPages} : {}),
      ...(coverImage ? {coverImage} : {}),
      pageBuilder: withoutWorkingFields(hero.body),
    })
  }
  return {docs, items}
}

// --- News -----------------------------------------------------------------------

export async function buildPosts(all: WpItem[], categories: WpCategory[]): Promise<Built> {
  // Categories: the Studio's own when one has the same slug, else a new one.
  const existing: Obj[] = await client.fetch('*[_type == "newsCategory" && !(_id in path("drafts.**"))]{_id, "slug": slug.current}')
  const existingBySlug = new Map(existing.map((c) => [c.slug, c._id]))
  const categoryDocs: Obj[] = []
  const categoryIdBySlug = new Map<string, string>()
  for (const cat of categories) {
    if (cat.slug === 'uncategorized') continue
    const id = existingBySlug.get(cat.slug) ?? `wp-category-${cat.id}`
    categoryIdBySlug.set(cat.slug, id)
    if (!existingBySlug.has(cat.slug)) categoryDocs.push({_id: id, _type: 'newsCategory', title: decode(cat.name), slug: {_type: 'slug', current: cat.slug}})
  }

  const items = selectItems(all)
  const docs: Obj[] = [...categoryDocs]
  for (const item of items) {
    const page: PageContext = {where: `post ${item.slug} (${item.language})`, practiceArea: false}
    console.log(`  ${page.where}`)
    const coverImage = await imageField(item.featuredImage?.url, item.featuredImage?.alt)
    if (!coverImage) note(page.where, 'No featured image: add a Cover Image before publishing.')
    const category = item.categories.map((s) => categoryIdBySlug.get(s)).find(Boolean)
    docs.push({
      _id: `wp-post-${item.id}`,
      _type: 'newsPost',
      language: item.language,
      title: title(item),
      slug: slug(item),
      ...(coverImage ? {coverImage} : {}),
      ...(category ? {category: {_type: 'reference', _ref: category}} : {}),
      ...(item.excerpt ? {excerpt: decode(item.excerpt)} : {}),
      pageBuilder: withoutWorkingFields(await pageBuilderFor(item, page)),
      // News dates are plain dates (news-post.ts).
      ...(item.date ? {publishedAt: item.date.slice(0, 10)} : {}),
      seo: await seoFor(item),
    })
  }
  return {docs, items}
}

// --- Translations -----------------------------------------------------------------

/**
 * Links each set of language versions, as the Translations menu does (one
 * translation.metadata per set). The versions come from WordPress, so a page
 * is linked to its translation even when that one isn't in this import yet:
 * the link's id is the same whichever language comes first, so a later
 * import fills in the same link rather than making a second one.
 */
export function translationLinks({docs, items}: Built, idPrefix: string): Obj[] {
  // A translation not imported yet is the same type as this one.
  const typeOf = new Map(docs.map((d) => [d._id, d._type]))
  const links = new Map<string, Obj>()
  for (const item of items) {
    const versions = Object.entries({[item.language]: item.id, ...item.translations})
    if (versions.length < 2) continue
    const id = `wp-translation-${idPrefix}-${Math.min(...versions.map(([, v]) => v))}`
    if (links.has(id)) continue
    const schemaType = typeOf.get(`${idPrefix}-${item.id}`) ?? 'page'
    links.set(id, {
      _id: id,
      _type: 'translation.metadata',
      schemaTypes: [schemaType],
      translations: versions.map(([language, wpId]) => ({
        _key: language,
        _type: 'internationalizedArrayReferenceValue',
        language,
        value: {_type: 'reference', _ref: `${idPrefix}-${wpId}`, _weak: true, _strengthenOnPublish: {type: schemaType}},
      })),
    })
  }
  return [...links.values()]
}

// --- What's already in Sanity ------------------------------------------------------

/**
 * Where a document "lives", to spot one Sanity already has: pages and
 * Practice Areas share addresses, News posts have their own, and a Lawyer,
 * Review or Case Result is the same one by its name or summary.
 */
function sameAs(doc: Obj): string | undefined {
  const plain = (text = '') =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  const slugOf = doc.slug?.current ?? doc.slug
  switch (doc._type) {
    case 'page':
    case 'practiceArea':
      return `page:${doc.language ?? DEFAULT_LANGUAGE}:${slugOf}`
    case 'newsPost':
      return `news:${doc.language ?? DEFAULT_LANGUAGE}:${slugOf}`
    case 'lawyer':
      // Middle initials aside: "Phyllis L. Sanders" is "Phyllis Sanders".
      return `lawyer:${plain(doc.name).split(' ').filter((w) => w.length > 1).join(' ')}`
    case 'review':
      return `review:${plain(doc.clientName)}`
    case 'caseResult':
      return `case:${plain(doc.summary)}`
    default:
      return undefined
  }
}

const label = (doc: Obj) => doc.title ?? doc.name ?? doc.clientName ?? doc.summary

/**
 * Drops imported documents Sanity already has (made in the Studio, not by an
 * import): a page at the same address would compete with it on the site, and
 * a second Lawyer or Case Result would be a duplicate. What linked to a
 * dropped one (a related page, a parent page) links to the
 * existing one instead; translation links just lose it, and one left with a
 * single version goes. A Lawyer, Review or Case Result Sanity already has
 * gets its empty fields filled instead (the fills returned). `allPages` is
 * every WordPress page, imported in this
 * run or not, so links to one Sanity already has are always redirected.
 */
/** Fields to add to a document Sanity already has, where it has none of its own. */
export interface Fill {
  id: string
  where: string
  fields: Obj
}

/** Records whose empty fields are filled from WordPress when Sanity already has them. */
const FILLED_TYPES = new Set(['lawyer', 'review', 'caseResult'])

export async function skipExisting(docs: Obj[], allPages: Obj[] = []): Promise<{docs: Obj[]; fills: Fill[]}> {
  const existing: Obj[] = await client.fetch(
    `*[_type in ["page", "practiceArea", "newsPost", "lawyer", "review", "caseResult"]
       && !(_id in path("drafts.**")) && !string::startsWith(_id, "wp-")]
      {..., "slug": slug.current, "language": coalesce(language, "${DEFAULT_LANGUAGE}")}`,
  )
  const existingBy = new Map(existing.map((e) => [sameAs(e), e]))

  /** Imported id → the existing document it's skipped for. */
  const replacedBy = new Map<string, string>()
  const fills: Fill[] = []
  for (const doc of docs) {
    const match = existingBy.get(sameAs(doc))
    if (!match) continue
    replacedBy.set(doc._id, match._id)
    const kinds: Record<string, string> = {newsPost: 'post', practiceArea: 'page', caseResult: 'case result', review: 'review', lawyer: 'lawyer'}
    const kind = kinds[doc._type] ?? doc._type
    // Pages and posts by address and language; Lawyers, Reviews and Case Results by name.
    const where = doc.language ? `${kind} ${doc.slug.current} (${doc.language})` : `${kind} ${label(doc)}`

    // A Lawyer, Review or Case Result made in the Studio keeps everything it
    // has, and gets what WordPress has for the fields it left empty (e.g. a
    // lawyer's bio and Spanish bio).
    const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    const missing = FILLED_TYPES.has(doc._type)
      ? Object.fromEntries(Object.entries(doc).filter(([k, v]) => !k.startsWith('_') && k !== 'publishedAt' && !empty(v) && empty(match[k])))
      : {}
    if (Object.keys(missing).length) {
      fills.push({id: match._id, where, fields: missing})
      note(where, `Already in Sanity as "${label(match)}": kept, and its empty ${Object.keys(missing).join(', ')} filled from WordPress.`)
    } else {
      note(where, `Skipped: Sanity already has "${label(match)}" (--include-existing imports it anyway).`)
    }
  }
  if (replacedBy.size) console.log(`\nSkipped ${replacedBy.size} already in Sanity (see the report).`)

  // Pages not in this run (--only) still count: a case result linking to a
  // WordPress page that Sanity already has should link to Sanity's.
  for (const page of allPages) {
    const match = existingBy.get(sameAs(page))
    if (match && !replacedBy.has(page._id)) replacedBy.set(page._id, match._id)
  }

  /** Points every reference at a skipped document to the existing one. */
  const relink = (value: any): any => {
    if (Array.isArray(value)) return value.map(relink)
    if (!value || typeof value !== 'object') return value
    const out = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, relink(v)]))
    if (typeof out._ref === 'string' && replacedBy.has(out._ref)) out._ref = replacedBy.get(out._ref)
    return out
  }

  const kept = docs.flatMap((doc) => {
    if (replacedBy.has(doc._id)) return []
    if (doc._type !== 'translation.metadata') return [relink(doc)]
    const translations = doc.translations.filter((t: Obj) => !replacedBy.has(t.value._ref))
    return translations.length < 2 ? [] : [{...doc, translations}]
  })
  return {docs: kept, fills: fills.map((f) => ({...f, fields: relink(f.fields)}))}
}
