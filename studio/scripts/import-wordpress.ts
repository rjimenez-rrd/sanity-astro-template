/**
 * Imports a WordPress + Elementor site into this Studio from a WordPress
 * export file (WordPress admin → Tools → Export → All content):
 *
 *   npm run import:wp -- --xml=export.xml --dry    see what it would import
 *   npm run import:wp -- --xml=export.xml          import, as drafts
 *   npm run import:wp:undo                         delete what it imported
 *
 * Pages become Pages (Practice Areas by their Page Type), News items become
 * News posts with their categories, case results, attorneys and testimonials
 * become Case Results, Lawyers and Reviews, and each Elementor layout becomes
 * Containers, Columns and blocks. Images are uploaded once each; English and
 * Spanish versions are linked as the Translations menu links them. What has
 * no block to match is listed in a report at the end, to rebuild by hand.
 *
 * Flags:
 *   --xml=export.xml    The export file (in the project folder, or a path).
 *   --dry               Write nothing and upload no images; the documents and
 *                       report are saved to scripts/.wp-import/ to check.
 *   --publish           Publish what it imports, instead of making drafts.
 *   --include-existing  Also import pages Sanity already has at the same
 *                       address; by default they're skipped and reported.
 *   --only=pages        Only pages; or posts (News), case-results, lawyers,
 *                       testimonials.
 *   --slug=about-us     Only the page or post with this slug.
 *   --limit=5           Only the first 5 in English, plus their translations.
 *   --undo              Delete everything an import created (wp- ids, drafts
 *                       too); with --dry, only count it.
 *
 * WP_UPLOADS_DIR (in studio/.env) points at a downloaded wp-content/uploads,
 * so images are read from it instead of downloaded from the site.
 *
 * The pieces are in scripts/wordpress/: what's specific to this site in
 * site-mappings.ts, the export file in export-file.ts, Elementor in
 * elementor.ts, and the documents it makes in documents.ts (pages, News),
 * case-results.ts, lawyers.ts and reviews.ts.
 */
import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {buildPages, buildPosts, skipExisting, translationLinks, type Fill} from './wordpress/documents'
import {useBottomCtaForm, useReviewIds} from './wordpress/elementor'
import {readExport, type WpExport} from './wordpress/export-file'
import {buildCaseResults} from './wordpress/case-results'
import {buildLawyers, type PageIdsBySlug} from './wordpress/lawyers'
import {buildReviews, reviewIds} from './wordpress/reviews'
import {client, options, OUT_DIR, report, site, type Obj} from './wordpress/options'

/** Kept published even without --publish: translation links point at published ids, and a post's category must be published to be referenced at all. */
const ALWAYS_PUBLISHED = new Set(['translation.metadata', 'newsCategory'])

/** Writes the documents, 50 per transaction so none hits the API's size limit. */
async function write(docs: Obj[]) {
  for (let i = 0; i < docs.length; i += 50) {
    const tx = client.transaction()
    for (const doc of docs.slice(i, i + 50)) {
      const draft = !options.publish && !ALWAYS_PUBLISHED.has(doc._type)
      tx.createOrReplace({...doc, _id: draft ? `drafts.${doc._id}` : doc._id} as Obj & {_id: string; _type: string})
    }
    await tx.commit({visibility: 'async'})
  }
}

/**
 * Fills the empty fields of documents Sanity already has (setIfMissing: a
 * field with a value is never touched). Their draft too, when one is open,
 * so the Studio shows the same.
 */
async function fillEmptyFields(fills: Fill[]) {
  if (!fills.length) return
  // Only drafts that exist: patching a missing document fails the whole transaction.
  const openDrafts = new Set<string>(
    await client.fetch('*[_id in $ids]._id', {ids: fills.map((f) => `drafts.${f.id}`)}, {perspective: 'raw'}),
  )
  const tx = client.transaction()
  for (const {id, fields} of fills) {
    tx.patch(id, (p) => p.setIfMissing(fields))
    if (openDrafts.has(`drafts.${id}`)) tx.patch(`drafts.${id}`, (p) => p.setIfMissing(fields))
  }
  await tx.commit({visibility: 'async'})
  console.log(`Filled empty fields on ${fills.length} already in Sanity.`)
}

/**
 * Deletes every document an import made, published and draft, found by its
 * wp- id. Documents made in the Studio, and categories it reused rather than
 * created, are left alone; uploaded images are kept for the next import.
 */
async function undo() {
  const {dataset} = client.config()
  const found: string[] = await client.fetch('*[string::startsWith(_id, "wp-") || string::startsWith(_id, "drafts.wp-")]._id', {}, {perspective: 'raw'})
  if (!found.length) return console.log(`Nothing to undo: no imported documents in "${dataset}".`)
  if (options.dryRun) return console.log(`Dry run: would delete ${found.length} imported documents from "${dataset}".`)
  // Categories last: Sanity won't delete one while a post still points to it,
  // and the posts may be in a later batch.
  const isCategory = (id: string) => id.replace(/^drafts\./, '').startsWith('wp-category-')
  const ids = [...found.filter((id) => !isCategory(id)), ...found.filter(isCategory)]
  for (let i = 0; i < ids.length; i += 100) {
    const tx = client.transaction()
    for (const id of ids.slice(i, i + 100)) tx.delete(id)
    await tx.commit({visibility: 'async'})
  }
  console.log(`Deleted ${ids.length} imported documents from "${dataset}". Uploaded images were kept.`)
}

function printReport() {
  const pages = Object.entries(report)
  if (!pages.length) return
  console.log(`\nTo check or finish by hand (also in scripts/.wp-import/report.json):`)
  for (const [where, messages] of pages) {
    console.log(`  ${where}`)
    for (const message of new Set(messages)) console.log(`    - ${message}`)
  }
}

/** What the import makes, in the order it makes them; --only picks one. */
const KINDS = ['pages', 'posts', 'case-results', 'lawyers', 'testimonials'] as const
type Kind = (typeof KINDS)[number]

const TITLES: Record<Kind, string> = {
  pages: 'Pages',
  posts: 'News',
  'case-results': 'Case Results',
  lawyers: 'Lawyers',
  testimonials: 'Reviews',
}

/** The Sanity documents for one kind of WordPress content. */
async function build(kind: Kind, wordpress: WpExport): Promise<Obj[]> {
  switch (kind) {
    case 'pages': {
      const pages = await buildPages(wordpress.pages)
      return [...pages.docs, ...translationLinks(pages, 'wp-page')]
    }
    case 'posts': {
      const posts = await buildPosts(wordpress.posts, wordpress.categories)
      return [...posts.docs, ...translationLinks(posts, 'wp-post')]
    }
    case 'case-results':
      return buildCaseResults(wordpress.caseResults)
    case 'lawyers': {
      // English pages by slug, for linking lawyers to their practice areas.
      const pageIds: PageIdsBySlug = new Map(wordpress.pages.filter((p) => p.language === 'en').map((p) => [p.slug, p.id]))
      return buildLawyers(wordpress.attorneys, pageIds)
    }
    case 'testimonials':
      return buildReviews(wordpress.testimonials)
  }
}

// sanity exec compiles to CommonJS, which has no top-level await.
async function main() {
  if (options.undo) return undo()
  if (!options.exportFile) throw new Error('Pass the WordPress export file: npm run import:wp -- --xml=export.xml --dry')

  const wordpress = readExport(options.exportFile)
  site.url = wordpress.siteUrl
  mkdirSync(OUT_DIR, {recursive: true})
  const {dataset} = client.config()
  console.log(`${options.dryRun ? 'Dry run: ' : ''}${options.exportFile} → Sanity dataset "${dataset}"`)

  // The Form CTA a "Bottom CTA" template becomes: Site Settings' default, else the first one made.
  useBottomCtaForm(
    await client.fetch(
      'coalesce(*[_id == "siteSettings"][0].defaultBottomForm._ref, *[_type == "ctaForm" && coalesce(language, "en") == "en" && !(_id in path("drafts.**"))] | order(_createdAt asc)[0]._id)',
    ),
  )

  // Testimonial Carousels name testimonials by WordPress id.
  useReviewIds(reviewIds(wordpress.testimonials))

  // --only=<kind>: just that kind; without it, every kind in order.
  if (options.only && !KINDS.includes(options.only as Kind)) {
    throw new Error(`Unknown --only=${options.only}. Use one of: ${KINDS.join(', ')}.`)
  }
  const kinds = options.only ? [options.only as Kind] : KINDS

  let docs: Obj[] = []
  for (const kind of kinds) {
    console.log(TITLES[kind])
    docs.push(...(await build(kind, wordpress)))
  }

  let fills: Fill[] = []
  if (!options.includeExisting) {
    // Every WordPress page by its address, to redirect links to the ones Sanity already has.
    const allPages = wordpress.pages.map((p) => ({_id: `wp-page-${p.id}`, _type: 'page', language: p.language, slug: {current: p.slug}}))
    ;({docs, fills} = await skipExisting(docs, allPages))
  }

  writeFileSync(join(OUT_DIR, 'documents.json'), JSON.stringify(docs, null, 2))
  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2))

  if (options.dryRun) {
    console.log(`\nDry run: ${docs.length} documents saved to scripts/.wp-import/documents.json, nothing written.`)
    if (fills.length) console.log(`Would fill empty fields on ${fills.length} already in Sanity (see the report).`)
  } else {
    await write(docs)
    await fillEmptyFields(fills)
    const how = options.publish ? ', published' : ' as drafts: publish them in the Studio once checked'
    console.log(`\nImported ${docs.length} documents into "${dataset}"${how}.`)
  }
  printReport()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
