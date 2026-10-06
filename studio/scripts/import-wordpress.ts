/**
 * Imports a WordPress + Elementor site into this Studio through the WordPress
 * REST API (or an export file): pages become Pages (Practice Areas when
 * their Page Type is Practice Area), News items and posts
 * become News posts (with their categories), and each Elementor layout becomes Containers, Columns and
 * blocks. Images are uploaded to Sanity once each; English and Spanish
 * versions are linked the way the Translations menu links them.
 *
 *   npm run import:wp -- --xml=export.xml --dry      from a WordPress export file
 *   npm run import:wp -- --dry                       from the REST API (WP_URL below)
 *
 * The export file is the easy way: WordPress admin → Tools → Export → All
 * content → Download. It holds Elementor's layouts, so nothing needs adding to
 * WordPress, and it's downloaded in the browser, past any firewall that turns
 * scripts away. Images still come from the live site, or from a downloaded
 * copy of wp-content/uploads (WP_UPLOADS_DIR).
 *
 * Settings: in studio/.env (see .env.example), or typed before the command:
 *   WP_URL            The WordPress site, e.g. https://thesandersfirm.com. Required.
 *   WP_USER           A WordPress user, and
 *   WP_APP_PASSWORD   an Application Password for it (Users → Profile). Optional:
 *                     they let it read Elementor's layout when the site only
 *                     shows it to logged-in users. A page without its layout
 *                     gets its rendered HTML instead.
 *   WP_LANGUAGES      Languages to fetch, default "en,es" (WPML or Polylang's ?lang=).
 *   WP_UPLOADS_DIR    A downloaded copy of wp-content/uploads: images are read
 *                     from it instead of downloaded from the site.
 *   With --xml, only WP_UPLOADS_DIR applies; the rest come from the file.
 *
 * Flags:
 *   --xml=export.xml  Read this WordPress export file instead of the REST API.
 *   --json=pages.json Read REST API responses saved from the browser instead
 *                     (comma-separate several files), e.g. the result of
 *                     /wp-json/wp/v2/pages?page-type=16&per_page=100.
 *   --publish         Publish what it imports. Without it, everything comes in
 *                     as drafts: nothing shows on the site until it's
 *                     published in the Studio.
 *   --include-existing  Also import pages Sanity already has at the same
 *                     address (made in the Studio); by default those are
 *                     skipped and listed in the report.
 *   --undo            Delete everything a previous import created (anything
 *                     with a wp- id, drafts too), to start again. With --dry,
 *                     only counts them.
 *   --dry             Fetch and convert, but write nothing to Sanity (and upload
 *                     no images). The documents are saved to scripts/.wp-import/
 *                     for checking.
 *   --only=pages      Only pages; --only=posts only posts.
 *   --slug=about-us   Only the page or post with this slug.
 *   --limit=5         Only the first 5 pages (and 5 posts) in the first
 *                     language, plus their translations.
 *
 * Elementor keeps its layout in the post meta _elementor_data, which the REST
 * API leaves out unless the site registers it. Add this to the theme's
 * functions.php (or a small plugin) before running:
 *
 *   add_action('init', function () {
 *     foreach (['page', 'post'] as $type) {
 *       register_post_meta($type, '_elementor_data', [
 *         'type' => 'string', 'single' => true,
 *         'show_in_rest' => true,
 *         'auth_callback' => fn () => current_user_can('edit_posts'),
 *       ]);
 *     }
 *   });
 *
 * Documents get ids from their WordPress ids (wp-page-12, wp-post-34, ...), so
 * running it again updates them instead of making copies. Run it against a
 * spare dataset first: SANITY_STUDIO_DATASET=staging npm run import:wp
 *
 * What it doesn't bring over: Elementor's styling (colors, spacing, fonts,
 * column widths) and widgets with no block to match, such as forms, sliders
 * and shortcodes. Those are listed in the report at the end, page by page, to
 * rebuild in the Studio.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {randomBytes} from 'node:crypto'
import {getCliClient} from 'sanity/cli'
import {JSDOM} from 'jsdom'
import {htmlToPortableText} from '@portabletext/html'
import {compileSchema, defineSchema} from '@portabletext/schema'

type Obj = Record<string, any>

// --- Settings ---------------------------------------------------------------

// The WP_ settings can live in studio/.env (gitignored) beside the Studio's
// own; a value typed on the command line still wins.
try {
  process.loadEnvFile(join(__dirname, '..', '.env'))
} catch {
  // No .env: the settings come from the command line.
}

const args = process.argv.slice(2)
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const DRY_RUN = args.includes('--dry')
/** Publish straight away; without it everything comes in as drafts, to check and publish in the Studio. */
const PUBLISH = args.includes('--publish')
/** Import pages even where Sanity already has one at the same address (made in the Studio). */
const INCLUDE_EXISTING = args.includes('--include-existing')

/** Delete everything a previous import created, to start again. */
const UNDO = args.includes('--undo')

/** Written published even without --publish (see the write loop in main). */
const ALWAYS_PUBLISHED = new Set(['translation.metadata', 'newsCategory'])
const ONLY = flag('only')
const ONLY_SLUG = flag('slug')
const LIMIT = Number(flag('limit')) || Infinity
/** A WordPress export file (Tools → Export) to read instead of the REST API. */
/**
 * A path as typed: npm runs this from studio/ even when the command was typed
 * at the project root, so a relative path is looked for there, in the project
 * root, then in studio/.
 */
function fromCwd(path: string | undefined) {
  if (!path) return undefined
  const bases = [process.env.INIT_CWD, join(__dirname, '..', '..'), process.cwd()].filter(Boolean) as string[]
  return bases.map((base) => resolve(base, path)).find((p) => existsSync(p)) ?? resolve(path)
}
const XML_FILE = fromCwd(flag('xml'))
/** REST API responses saved as files (e.g. /wp-json/wp/v2/pages?page-type=16 opened in a browser), to read instead of the API. */
const JSON_FILES = flag('json')?.split(',').map((f) => fromCwd(f.trim())!)

let WP_URL = (process.env.WP_URL || '').replace(/\/+$/, '')
/** A downloaded copy of wp-content/uploads, used instead of downloading each image from the site. */
const UPLOADS_DIR = fromCwd(process.env.WP_UPLOADS_DIR || undefined)
const WP_AUTH =
  process.env.WP_USER && process.env.WP_APP_PASSWORD
    ? 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64')
    : null
const LANGUAGES = (process.env.WP_LANGUAGES || 'en,es').split(',').map((l) => l.trim()).filter(Boolean)
const DEFAULT_LANGUAGE = 'en'

/**
 * WordPress types that become News posts: the site's custom News type, and
 * regular posts if it has any. Their categories come from either taxonomy.
 */
const NEWS_TYPES = ['news', 'post']
const NEWS_TAXONOMIES = ['news-category', 'category']

/** Saved Elementor templates that are one of the site's built-in CTA Banners, by template id (English, Spanish). */
const TEMPLATE_BANNERS: Record<string, string> = {'687': 'we-have-your-back', '1022': 'we-have-your-back'}

/** The "Bottom CTA" template (English, Spanish): the form section, a Form CTA block here. */
const BOTTOM_CTA_TEMPLATES = new Set(['264', '949'])

/**
 * What each Elementor loop lists, by the id of its loop item template — the
 * export only gives the template, not the post type.
 */
const LOOP_TEMPLATES: Record<string, string> = {
  '446': 'testimonials', '680': 'testimonials',
  '492': 'case-result', '1103': 'case-result', '945': 'case-result', '1506': 'case-result',
  '238': 'news', '674': 'news', '463': 'news',
  '195': 'attorneys',
  '252': 'videos',
  '177': 'related-pages',
  '932': 'search',
}

/** Pages with this Page Type (the site's page-type taxonomy) become Practice Areas. */
const PRACTICE_AREA_TYPE = 'practice-area'

const OUT_DIR = join(__dirname, '.wp-import')
const ASSET_CACHE = join(OUT_DIR, 'assets.json')

const client = getCliClient({apiVersion: '2025-02-19'})

// --- Helpers ----------------------------------------------------------------

const key = () => randomBytes(6).toString('hex')

/** The Form CTA a "Bottom CTA" template becomes: Site Settings' default, else the first one made. */
let defaultFormCta: string | undefined

/** Notes for the report: what was left out, per page. */
const report: Record<string, string[]> = {}
const note = (where: string, message: string) => (report[where] ??= []).push(message)

const decode = (html: string) => new JSDOM(`<!doctype html><body>${html}`).window.document.body.textContent?.trim() ?? ''

/** The site's own links as paths (/contact-us/), so they stay on whichever domain the site moves to. */
function localHref(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url, WP_URL)
    const site = new URL(WP_URL)
    if (parsed.hostname.replace(/^www\./, '') === site.hostname.replace(/^www\./, '')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return parsed.href
  } catch {
    return url
  }
}

async function wpFetch(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${WP_URL}/wp-json${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      // Some hosts' firewalls turn away requests without a browser-like agent.
      'User-Agent': 'Mozilla/5.0 (Sanity WordPress import)',
      ...(WP_AUTH ? {Authorization: WP_AUTH} : {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} from ${url}\n${body.slice(0, 300)}`)
  }
  return {data: await res.json(), totalPages: Number(res.headers.get('x-wp-totalpages')) || 1}
}

/** Every item of a collection, page by page. */
async function fetchAll(path: string, params: Record<string, string | number> = {}): Promise<Obj[]> {
  const items: Obj[] = []
  for (let page = 1; ; page++) {
    const {data, totalPages} = await wpFetch(path, {per_page: 100, page, ...params})
    items.push(...data)
    if (page >= totalPages || data.length === 0) return items
  }
}

/** A request whose route may not exist on this site (a type or taxonomy it doesn't have): [] then. */
async function optional<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch (error) {
    if (/^404 /.test((error as Error).message)) return []
    throw error
  }
}

// --- Images -----------------------------------------------------------------

/** WordPress image URL → Sanity asset id, kept between runs so nothing uploads twice. */
const assetCache: Record<string, string> = (() => {
  try {
    return JSON.parse(readFileSync(ASSET_CACHE, 'utf8'))
  } catch {
    return {}
  }
})()

async function uploadImage(url: string | undefined): Promise<string | null> {
  if (!url) return null
  const absolute = new URL(url, WP_URL).href
  if (assetCache[absolute]) return assetCache[absolute]
  if (DRY_RUN) return `image-dry-run-${Buffer.from(absolute).toString('base64url').slice(-16)}`
  try {
    const local = UPLOADS_DIR && absolute.match(/\/wp-content\/uploads\/(.+)$/)?.[1]
    let buffer: Buffer
    if (local && existsSync(join(UPLOADS_DIR!, decodeURIComponent(local)))) {
      buffer = readFileSync(join(UPLOADS_DIR!, decodeURIComponent(local)))
    } else {
      const res = await fetch(absolute, {headers: {'User-Agent': 'Mozilla/5.0 (Sanity WordPress import)'}})
      if (!res.ok) throw new Error(`${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    }
    const filename = decodeURIComponent(new URL(absolute).pathname.split('/').pop() || 'image')
    const asset = await client.assets.upload('image', buffer, {filename})
    assetCache[absolute] = asset._id
    writeFileSync(ASSET_CACHE, JSON.stringify(assetCache, null, 2))
    return asset._id
  } catch (error) {
    console.warn(`  Couldn't upload ${absolute}: ${(error as Error).message}`)
    return null
  }
}

async function imageField(url: string | undefined, alt?: string) {
  const ref = await uploadImage(url)
  return ref ? {_type: 'image', asset: {_type: 'reference', _ref: ref}, ...(alt ? {alt} : {})} : null
}

// --- Rich text --------------------------------------------------------------

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
 * HTML → the Studio's Rich Text: headings h5/h6 become h4, body text uses
 * "Paragraph" (the 18px style editors use for body copy) and list items
 * "Normal", links to the old
 * site become paths, and images are uploaded.
 */
async function richText(html: string | undefined): Promise<Obj[]> {
  if (!html?.trim()) return []
  const prepared = html.replace(/<(\/?)h[56]\b/gi, '<$1h4')
  const blocks = htmlToPortableText(prepared, {
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
    // List items stay Normal: the list sets its own 16px size (PtList.astro).
    if (block.style === 'normal' && !block.listItem) block.style = 'paragraph'
    for (const def of block.markDefs ?? []) {
      if (def._type === 'link') def.href = localHref(def.href)
    }
    // Leave out the empty paragraphs Elementor's editor tends to add.
    const text = (block.children ?? []).map((c: Obj) => c.text ?? '').join('').trim()
    if (!text && !block.listItem) continue
    out.push(block)
  }
  return out
}

const richTextBlock = (content: Obj[]) => (content.length ? {_type: 'richTextBlock', _key: key(), content} : null)

/** A link field (linkExternal / pageSlug) from an Elementor link setting. */
function linkItems(link: Obj | undefined, title: string): Obj[] {
  const href = localHref(link?.url)
  if (!href) return []
  if (href.startsWith('/')) return [{_type: 'pageSlug', _key: key(), title, slug: href}]
  return [{_type: 'linkExternal', _key: key(), title, url: href, openInNewTab: Boolean(link?.is_external)}]
}

// --- Elementor widgets → blocks ----------------------------------------------

/** One Elementor widget as zero or more blocks. */
async function widgetBlocks(widget: Obj, where: string): Promise<Obj[]> {
  const s: Obj = widget.settings ?? {}
  const type: string = widget.widgetType

  switch (type) {
    case 'heading': {
      // A "heading" set to a p/div/span tag is styled text, not a heading.
      const tag = /^h[1-6]$/.test(s.header_size) ? s.header_size : s.header_size ? 'p' : 'h2'
      const block = richTextBlock(await richText(`<${tag}>${s.title ?? ''}</${tag}>`))
      return block ? [block] : []
    }
    case 'text-editor': {
      const block = richTextBlock(await richText(s.editor))
      return block ? [block] : []
    }
    case 'image': {
      const image = await imageField(s.image?.url, s.image?.alt)
      if (!image) return []
      return [{_type: 'imageBlock', _key: key(), image, ...(s.caption ? {caption: s.caption} : {})}]
    }
    case 'button': {
      const label = decode(s.text ?? '')
      const link = linkItems(s.link, label)
      if (!label || !link.length) return []
      return [{_type: 'callToAction', _key: key(), label, variant: 'primary', link}]
    }
    case 'video': {
      const source = s.video_type || 'youtube'
      const url = s[`${source}_url`] ?? s.youtube_url
      if (source === 'hosted') {
        const hostedUrl = s.hosted_url?.url ?? s.external_url?.url
        return hostedUrl ? [{_type: 'video', _key: key(), source: 'hosted', hostedExternal: true, hostedUrl}] : []
      }
      return url ? [{_type: 'video', _key: key(), source, url, controls: true}] : []
    }
    case 'nested-accordion':
    case 'accordion':
    case 'toggle': {
      const panels = []
      for (const tab of s.tabs ?? []) {
        panels.push({
          _type: 'accordionPanel',
          _key: key(),
          title: decode(tab.tab_title ?? ''),
          content: await richText(tab.tab_content),
        })
      }
      return panels.length ? [{_type: 'accordion', _key: key(), panels, allowMultipleOpen: type === 'toggle'}] : []
    }
    case 'icon-box':
    case 'image-box': {
      const title = decode(s.title_text ?? '')
      if (!title) return []
      const icon = type === 'image-box' ? await imageField(s.image?.url, s.image?.alt) : null
      const label = s.link?.url ? decode(s.title_text ?? '') : ''
      return [
        {
          _type: 'iconText',
          _key: key(),
          title,
          ...(s.description_text ? {description: decode(s.description_text)} : {}),
          ...(icon ? {icon} : {}),
          ...(label ? {link: {_type: 'callToAction', label, link: linkItems(s.link, label)}} : {}),
        },
      ]
    }
    case 'counter':
      return [
        {
          _type: 'statMetric',
          _key: key(),
          value: String(s.ending_number ?? ''),
          label: decode(s.title ?? ''),
          ...(s.prefix ? {prefix: s.prefix} : {}),
          ...(s.suffix ? {suffix: s.suffix} : {}),
        },
      ]
    case 'testimonial': {
      const quote = decode(s.testimonial_content ?? '')
      const name = decode(s.testimonial_name ?? '')
      if (!quote || !name) return []
      const avatar = await imageField(s.testimonial_image?.url)
      return [
        {
          _type: 'testimonialQuote',
          _key: key(),
          quote,
          name,
          ...(s.testimonial_job ? {title: decode(s.testimonial_job)} : {}),
          ...(avatar ? {avatar} : {}),
        },
      ]
    }
    case 'icon-list': {
      const items = (s.icon_list ?? [])
        .map((item: Obj) => {
          const text = item.text ?? ''
          const href = localHref(item.link?.url)
          return `<li>${href ? `<a href="${href}">${text}</a>` : text}</li>`
        })
        .join('')
      const block = richTextBlock(await richText(`<ul>${items}</ul>`))
      return block ? [block] : []
    }
    case 'spacer':
      return [{_type: 'spacerDivider', _key: key(), height: 'md', showDivider: false}]
    case 'divider':
      return [{_type: 'spacerDivider', _key: key(), height: 'sm', showDivider: true}]
    case 'google_maps':
      return s.address
        ? [
            {
              _type: 'mapEmbed',
              _key: key(),
              embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`,
            },
          ]
        : []
    case 'html':
      // The site's "Show More" toggles are page scripting, not content.
      if (/toggle-clamp-btn/.test(s.html ?? '')) return []
      return s.html?.trim() ? [{_type: 'htmlBlock', _key: key(), html: s.html}] : []
    case 'icon':
      // Decoration (e.g. the row of review stars); nothing to carry over.
      return []
    case 'template': {
      // A saved Elementor template placed on the page: template_id in
      // Elementor's data, templateId when read from its HTML.
      const id = String(s.template_id ?? s.templateId ?? '')
      // The "We Have Your Back" banner is the CTA Banner block (frontend/src/lib/banners.ts).
      if (TEMPLATE_BANNERS[id] || /We Have Your Back|Lo Respaldamos/i.test(s.text ?? '')) {
        return [{_type: 'ctaBanner', _key: key(), banner: TEMPLATE_BANNERS[id] ?? 'we-have-your-back'}]
      }
      if (BOTTOM_CTA_TEMPLATES.has(id)) {
        // A Practice Area's template draws its own bottom form; elsewhere it's a Form CTA block.
        if (where.startsWith('practice area')) return []
        return defaultFormCta ? [{_type: 'formCta', _key: key(), cta: {_type: 'reference', _ref: defaultFormCta}}] : []
      }
      note(where, `Saved Elementor template #${id || '?'} not imported, rebuild it in the Studio.`)
      return []
    }
    case 'loop-carousel':
    case 'loop-grid': {
      // What it lists: from its HTML, else its loop item template, else its query.
      const loopOf = s.loopOf ?? LOOP_TEMPLATES[String(s.template_id)] ?? s.post_query_post_type
      // Testimonials: the Testimonial Carousel shows every Review when none are picked.
      if (loopOf === 'testimonials') return [{_type: 'testimonialCarousel', _key: key()}]
      // Recent news: News Cards shows the latest posts.
      if (loopOf === 'news') return [{_type: 'newsCards', _key: key(), source: 'latest', count: 3}]
      // Drawn by the site itself: the sidebar's Related Pages, the search page.
      if (loopOf === 'related-pages' || loopOf === 'search' || loopOf === 'current_query') return []
      const blockFor: Record<string, string> = {'case-result': 'Case Results', attorneys: 'Lawyer Cards'}
      note(
        where,
        blockFor[loopOf]
          ? `A ${blockFor[loopOf]} carousel: add a ${blockFor[loopOf]} block and pick what it shows.`
          : `An Elementor loop of "${loopOf ?? 'posts'}" not imported, rebuild it in the Studio.`,
      )
      return []
    }
    case 'breadcrumbs':
      // The site draws its own breadcrumbs.
      return []
    case 'uael-gf-styler':
    case 'form':
      note(where, 'A form: add a Form or Form CTA block.')
      return []
    default:
      note(where, `Widget "${type}" not imported, rebuild it in the Studio.`)
      return []
  }
}

/** Every widget inside an element, depth-first: inner sections and nested containers flatten into the column. */
async function blocksIn(elements: Obj[], where: string): Promise<Obj[]> {
  const out: Obj[] = []
  for (const el of elements ?? []) {
    if (el.elType === 'widget') out.push(...(await widgetBlocks(el, where)))
    else out.push(...(await blocksIn(el.elements, where)))
  }
  return out
}

// The settings new Containers and Columns get in the Studio (as on About Us).
const CONTAINER = {
  layoutType: 'flex',
  contentWidth: 'boxed',
  direction: {tablet: 'column'},
  gap: {desktop: {column: 40, row: 40, unit: 'px'}, mobile: {column: 16, row: 16, unit: 'px'}, linked: true},
}
const COLUMN = {layoutType: 'flex', direction: {desktop: 'column'}, gap: {desktop: {column: 24, row: 24, unit: 'px'}}}

/**
 * Text that runs on (Elementor's heading, text, heading, text... widgets) as
 * one Rich Text block rather than one per widget, so it's edited in one place.
 */
function mergeText(content: Obj[]): Obj[] {
  const out: Obj[] = []
  for (const block of content) {
    const previous = out[out.length - 1]
    if (block._type === 'richTextBlock' && previous?._type === 'richTextBlock') {
      previous.content = [...previous.content, ...block.content]
    } else out.push(block)
  }
  return out
}

const column = (content: Obj[]) => ({_type: 'gridColumn', _key: key(), container: COLUMN, content: mergeText(content)})
const container = (columns: Obj[], label?: string) => ({
  _type: 'gridRow',
  _key: key(),
  ...(label ? {label} : {}),
  container: CONTAINER,
  columns,
})

/**
 * Elementor's layout → the Page Builder. A section (or a top-level container)
 * becomes a Container; its columns (or child containers) become Columns.
 * A container holding widgets directly gets one Column for them.
 */
async function elementorToPageBuilder(elements: Obj[], where: string): Promise<Obj[]> {
  const rows: Obj[] = []
  for (const el of elements) {
    const children: Obj[] = el.elements ?? []
    // Columns: a section's columns, or a container's child containers when
    // that's all it holds (a row of them). A container mixing widgets with
    // inner containers is one flow down the page, so it stays one Column with
    // everything in order.
    const columnEls =
      el.elType === 'section'
        ? children.filter((c) => c.elType === 'column')
        : children.length > 1 && children.every((c) => c.elType === 'container')
          ? children
          : []

    // One at a time, so an image used twice is only uploaded once.
    const columns: Obj[] = []
    if (columnEls.length) for (const col of columnEls) columns.push(column(await blocksIn(col.elements, where)))
    else columns.push(column(await blocksIn(children, where)))

    const filled = columns.filter((c) => c.content.length > 0)
    if (filled.length) {
      // The section's background image, a hero image candidate for a Practice
      // Area (splitHero); never written to Sanity.
      const background = el.settings?.background_image?.url
      rows.push({...container(filled, el.settings?._title), ...(background ? {__background: background} : {})})
    }
  }
  return rows
}

/**
 * The rendered HTML, when Elementor's layout isn't available: one Container,
 * one Column, with the text as Rich Text and YouTube/Vimeo embeds as Videos.
 */
async function htmlToPageBuilder(html: string, where: string): Promise<Obj[]> {
  const doc = new JSDOM(`<!doctype html><body>${html}`).window.document
  const blocks: Obj[] = []
  for (const iframe of Array.from(doc.querySelectorAll('iframe'))) {
    const src = iframe.getAttribute('src') ?? ''
    const source = /youtu/.test(src) ? 'youtube' : /vimeo/.test(src) ? 'vimeo' : null
    if (source) blocks.push({_type: 'video', _key: key(), source, url: src, controls: true})
    else note(where, `Embed not imported: ${src}`)
    iframe.remove()
  }
  for (const form of Array.from(doc.querySelectorAll('form'))) {
    note(where, 'A form was left out, add a Form or Form CTA block.')
    form.remove()
  }
  const text = richTextBlock(await richText(doc.body.innerHTML))
  return text || blocks.length ? [container([column([...(text ? [text] : []), ...blocks])])] : []
}

/**
 * Elementor's rendered HTML → the same element tree _elementor_data holds.
 * Elementor marks every container and widget with data-element_type (and
 * data-widget_type), so the rows, columns and widgets can be read back from
 * the HTML the REST API returns — no _elementor_data needed. Only what the
 * HTML shows is recovered: content, not Elementor's styling settings.
 */
function elementorHtmlToElements(html: string): Obj[] {
  const doc = new JSDOM(`<!doctype html><body>${html}`).window.document
  return childElements(doc.querySelector('[data-elementor-type]') ?? doc.body, null)
}

/** The elements directly inside `node`: the marked ones whose nearest marked ancestor is `owner`. */
function childElements(node: Element, owner: Element | null): Obj[] {
  return Array.from(node.querySelectorAll('[data-element_type]'))
    .filter((el) => (el.parentElement?.closest('[data-element_type]') ?? null) === owner)
    .map(toElement)
}

function toElement(el: Element): Obj {
  const type = el.getAttribute('data-element_type')
  if (type !== 'widget') {
    return {elType: type === 'section' || type === 'column' ? type : 'container', settings: {}, elements: childElements(el, el)}
  }
  const widgetType = (el.getAttribute('data-widget_type') ?? '').split('.')[0]
  return {elType: 'widget', widgetType, settings: widgetSettings(el, widgetType)}
}

/** The settings widgetBlocks reads, recovered from a widget's HTML. */
function widgetSettings(el: Element, type: string): Obj {
  const box = el.querySelector('.elementor-widget-container') ?? el
  const q = (selector: string) => box.querySelector(selector)
  const textOf = (selector: string) => q(selector)?.textContent?.trim() ?? ''
  const dataSettings = (() => {
    try {
      return JSON.parse(el.getAttribute('data-settings') ?? '{}')
    } catch {
      return {}
    }
  })()
  const linkOf = (a: Element | null | undefined) =>
    a?.getAttribute('href') ? {url: a.getAttribute('href'), is_external: a.getAttribute('target') === '_blank'} : undefined
  const imageOf = (img: Element | null) =>
    img ? {url: img.getAttribute('data-lazy-src') || img.getAttribute('data-src') || img.getAttribute('src'), alt: img.getAttribute('alt') ?? ''} : undefined

  switch (type) {
    case 'heading': {
      const title = q('.elementor-heading-title')
      return {title: title?.innerHTML ?? '', header_size: title?.tagName.toLowerCase()}
    }
    case 'text-editor':
    case 'html':
      return type === 'html' ? {html: box.innerHTML.trim()} : {editor: box.innerHTML}
    case 'image':
      return {image: imageOf(q('img')), caption: textOf('figcaption')}
    case 'button':
      return {text: textOf('.elementor-button-text') || textOf('a'), link: linkOf(q('a'))}
    case 'video':
      return dataSettings
    case 'nested-accordion':
      return {
        tabs: Array.from(box.querySelectorAll('details')).map((d) => ({
          tab_title: d.querySelector('.e-n-accordion-item-title-text')?.textContent?.trim() ?? d.querySelector('summary')?.textContent?.trim() ?? '',
          tab_content: Array.from(d.children).filter((c) => c.tagName !== 'SUMMARY').map((c) => c.innerHTML).join(''),
        })),
      }
    case 'accordion':
    case 'toggle':
      return {
        tabs: Array.from(box.querySelectorAll('.elementor-tab-title')).map((t) => ({
          tab_title: t.textContent?.trim() ?? '',
          tab_content: t.nextElementSibling?.innerHTML ?? '',
        })),
      }
    case 'icon-list':
      return {
        icon_list: Array.from(box.querySelectorAll('.elementor-icon-list-item')).map((li) => ({
          text: li.querySelector('.elementor-icon-list-text')?.textContent?.trim() ?? li.textContent?.trim() ?? '',
          link: linkOf(li.querySelector('a')),
        })),
      }
    case 'counter':
      return {
        ending_number: q('.elementor-counter-number')?.getAttribute('data-to-value') ?? textOf('.elementor-counter-number'),
        prefix: textOf('.elementor-counter-number-prefix'),
        suffix: textOf('.elementor-counter-number-suffix'),
        title: textOf('.elementor-counter-title'),
      }
    case 'testimonial':
      return {
        testimonial_content: textOf('.elementor-testimonial-content'),
        testimonial_name: textOf('.elementor-testimonial-name'),
        testimonial_job: textOf('.elementor-testimonial-job'),
        testimonial_image: imageOf(q('.elementor-testimonial-image img')),
      }
    case 'icon-box':
    case 'image-box':
      return {
        title_text: textOf(`.elementor-${type}-title`),
        description_text: textOf(`.elementor-${type}-description`),
        link: linkOf(q(`.elementor-${type}-title a`)),
        image: imageOf(q(`.elementor-${type}-img img`)),
      }
    case 'google_maps':
      return {address: decodeURIComponent(q('iframe')?.getAttribute('src')?.match(/[?&]q=([^&]+)/)?.[1] ?? '').replace(/\+/g, ' ')}
    case 'template':
      return {templateId: q('[data-elementor-id]')?.getAttribute('data-elementor-id'), text: box.textContent ?? ''}
    case 'loop-carousel':
    case 'loop-grid': {
      // What the loop lists: its items carry their post type as a class, e.g. type-case-result.
      const item = q('.e-loop-item')
      return {loopOf: item?.className.match(/\btype-([\w-]+)/)?.[1]}
    }
    default:
      return {}
  }
}

async function pageBuilderFor(item: Obj, where: string): Promise<Obj[]> {
  const raw = item.meta?._elementor_data
  if (raw) {
    try {
      const elements = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(elements) && elements.length) return elementorToPageBuilder(elements, where)
    } catch {
      note(where, "Elementor's layout couldn't be read, so the rendered HTML was used.")
    }
  }
  // Without _elementor_data, the layout read back from Elementor's HTML.
  const html: string = item.content?.rendered ?? ''
  if (/data-element_type=/.test(html)) {
    const elements = elementorHtmlToElements(html)
    if (elements.length) return elementorToPageBuilder(elements, where)
  }
  note(where, 'Not built with Elementor: imported its content as one Container.')
  return htmlToPageBuilder(html, where)
}

// --- WordPress export file ---------------------------------------------------

type XmlSource = {pages: Obj[]; posts: Obj[]; categories: Obj[]}
let xmlSource: XmlSource | undefined

/** "2024-01-02 03:04:05" → "2024-01-02T03:04:05", as the REST API writes dates. */
const isoDate = (value: string) => (value && !value.startsWith('0000') ? value.replace(' ', 'T') : '')

/**
 * Reads a WordPress export (Tools → Export → All content) into the same
 * shape the REST API returns, so everything after works the same either way.
 *
 * Languages: Polylang writes each post's language and its translation set
 * into the export; WPML doesn't, so then the language is read from the
 * address (/es/... is Spanish) and versions can't be paired automatically.
 */
function loadXml(): XmlSource {
  if (xmlSource) return xmlSource
  const xml = readFileSync(XML_FILE!, 'utf8')
  const doc = new JSDOM(xml, {contentType: 'text/xml'}).window.document
  const text = (el: Element | Document, tag: string) => el.getElementsByTagName(tag)[0]?.textContent ?? ''

  WP_URL ||= (text(doc, 'wp:base_blog_url') || text(doc, 'link')).replace(/\/+$/, '')

  // Post categories, and the News type's own News Categories (a custom taxonomy).
  const categories = [
    ...Array.from(doc.getElementsByTagName('wp:category')).map((c) => ({
      id: Number(text(c, 'wp:term_id')),
      slug: text(c, 'wp:category_nicename'),
      name: text(c, 'wp:cat_name'),
    })),
    ...Array.from(doc.getElementsByTagName('wp:term'))
      .filter((t) => NEWS_TAXONOMIES.includes(text(t, 'wp:term_taxonomy')))
      .map((t) => ({id: Number(text(t, 'wp:term_id')), slug: text(t, 'wp:term_slug'), name: text(t, 'wp:term_name')})),
  ]
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]))

  const items = Array.from(doc.getElementsByTagName('item')).map((el) => {
    const meta: Record<string, string> = {}
    for (const pm of Array.from(el.getElementsByTagName('wp:postmeta'))) {
      meta[text(pm, 'wp:meta_key')] = text(pm, 'wp:meta_value')
    }
    const terms = Array.from(el.getElementsByTagName('category')).map((c) => ({
      domain: c.getAttribute('domain'),
      slug: c.getAttribute('nicename') ?? '',
    }))
    return {el, meta, terms, type: text(el, 'wp:post_type'), status: text(el, 'wp:status'), id: Number(text(el, 'wp:post_id'))}
  })

  const attachments = new Map(
    items.filter((i) => i.type === 'attachment').map((i) => [
      i.id,
      {url: text(i.el, 'wp:attachment_url'), alt: i.meta._wp_attachment_image_alt ?? ''},
    ]),
  )

  const toItem = (i: (typeof items)[number]): Obj => {
    const link = text(i.el, 'link')
    const pathLang = (() => {
      try {
        return new URL(link).pathname.match(/^\/([a-z]{2})\//)?.[1]
      } catch {
        return undefined
      }
    })()
    const yoastTitle = i.meta._yoast_wpseo_title
    const featured = attachments.get(Number(i.meta._thumbnail_id))
    return {
      id: i.id,
      slug: text(i.el, 'wp:post_name'),
      parent: Number(text(i.el, 'wp:post_parent')) || 0,
      title: {rendered: text(i.el, 'title')},
      content: {rendered: text(i.el, 'content:encoded')},
      excerpt: {rendered: text(i.el, 'excerpt:encoded')},
      date: isoDate(text(i.el, 'wp:post_date')),
      date_gmt: isoDate(text(i.el, 'wp:post_date_gmt')),
      meta: i.meta._elementor_data ? {_elementor_data: i.meta._elementor_data} : {},
      // The ACF fields the import uses, in the shape the REST API's acf has them.
      acf: {intro_text: i.meta.intro_text, acf_related_pages: i.meta.acf_related_pages},
      // Polylang's language term, else the address.
      lang: i.terms.find((t) => t.domain === 'language')?.slug || pathLang || undefined,
      translationGroup: i.terms.find((t) => t.domain === 'post_translations')?.slug,
      pageTypes: i.terms.filter((t) => t.domain === 'page-type').map((t) => t.slug),
      locationSlugs: i.terms.filter((t) => t.domain === 'location').map((t) => t.slug),
      categories: i.terms
        .filter((t) => NEWS_TAXONOMIES.includes(t.domain ?? ''))
        .map((t) => categoryBySlug.get(t.slug))
        .filter(Boolean),
      ...(featured ? {_embedded: {'wp:featuredmedia': [{source_url: featured.url, alt_text: featured.alt}]}} : {}),
      yoast_head_json: {
        // Yoast's %%title%%-style templates only make sense inside WordPress.
        ...(yoastTitle && !yoastTitle.includes('%%') ? {title: yoastTitle} : {}),
        ...(i.meta._yoast_wpseo_metadesc ? {description: i.meta._yoast_wpseo_metadesc} : {}),
        ...(i.meta['_yoast_wpseo_opengraph-image'] ? {og_image: [{url: i.meta['_yoast_wpseo_opengraph-image']}]} : {}),
        ...(i.meta['_yoast_wpseo_meta-robots-noindex'] === '1' ? {robots: {index: 'noindex'}} : {}),
      },
    }
  }

  const published = (type: string) => items.filter((i) => i.type === type && i.status === 'publish').map(toItem)
  const pages = published('page')
  const posts = NEWS_TYPES.flatMap(published)

  // Polylang's translation sets: every post in a set lists the others.
  for (const list of [pages, posts]) {
    const groups = new Map<string, Obj[]>()
    for (const item of list) if (item.translationGroup) groups.set(item.translationGroup, [...(groups.get(item.translationGroup) ?? []), item])
    for (const group of groups.values()) {
      for (const item of group) item.translations = Object.fromEntries(group.map((g) => [g.lang ?? DEFAULT_LANGUAGE, g.id]))
    }
  }

  xmlSource = {pages, posts, categories}
  return xmlSource
}

// --- Saved REST API responses -------------------------------------------------

let jsonSource: {pages: Obj[]; posts: Obj[]} | undefined

/**
 * REST API responses saved from the browser (past the firewall that turns
 * scripts away): each file a list of pages and/or News items, as
 * /wp-json/wp/v2/pages or /wp-json/wp/v2/news return them. The layout is read
 * from Elementor's HTML in each item's content.
 */
function loadJson() {
  if (jsonSource) return jsonSource
  const items: Obj[] = JSON_FILES!.flatMap((file) => {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    return Array.isArray(data) ? data : [data]
  })
  if (!WP_URL && items[0]?.link) WP_URL = new URL(items[0].link).origin
  // The same item saved in two files counts once.
  const unique = [...new Map(items.map((i) => [i.id, i])).values()]
  jsonSource = {
    pages: unique.filter((i) => i.type === 'page'),
    posts: unique.filter((i) => NEWS_TYPES.includes(i.type)),
  }
  return jsonSource
}

// --- Documents --------------------------------------------------------------

/** Which language an item is in: Polylang's lang, WPML's locale, else the language it was fetched under. */
function languageOf(item: Obj, fetchedAs: string): string {
  const lang = item.lang ?? item.wpml_current_locale ?? item.language ?? fetchedAs
  return String(lang).slice(0, 2).toLowerCase()
}

/** Ids of the item's other-language versions: Polylang's translations, or WPML's wpml_translations. */
function translationIds(item: Obj): number[] {
  if (item.translations && typeof item.translations === 'object') {
    return Object.values(item.translations).map(Number).filter(Boolean)
  }
  if (Array.isArray(item.wpml_translations)) return item.wpml_translations.map((t: Obj) => Number(t.id)).filter(Boolean)
  return []
}

async function seoFor(item: Obj) {
  const yoast = item.yoast_head_json
  if (!yoast) return undefined
  const ogImage = await imageField(yoast.og_image?.[0]?.url)
  const seo = {
    ...(yoast.title ? {metaTitle: decode(yoast.title)} : {}),
    ...(yoast.description ? {metaDescription: decode(yoast.description)} : {}),
    ...(ogImage ? {ogImage} : {}),
    ...(yoast.robots?.index === 'noindex' ? {noIndex: true} : {}),
  }
  return Object.keys(seo).length ? {_type: 'seo', ...seo} : undefined
}

type Fetched = {item: Obj; language: string}

/** Ask for WordPress's edit view while logged in; dropped if WordPress refuses it. */
let useEditContext = Boolean(WP_AUTH)

/** Each item once, in the language it's in; without a translation plugin every language returns the same items. */
async function fetchInLanguages(path: string, params: Record<string, string | number>): Promise<Fetched[]> {
  const seen = new Map<number, Fetched>()
  if (XML_FILE || JSON_FILES) {
    const source = XML_FILE ? loadXml() : loadJson()
    const items = path.endsWith('/pages') ? source.pages : source.posts
    for (const item of items) seen.set(item.id, {item, language: languageOf(item, DEFAULT_LANGUAGE)})
  } else {
    for (const lang of LANGUAGES) {
      const items = await fetchAll(path, {...params, lang, ...(useEditContext ? {context: 'edit'} : {})}).catch((error) => {
        // The edit view (raw content and private meta) needs a user allowed to
        // edit pages. Refused: the public view, which carries everything this
        // reads — the layout comes from Elementor's HTML.
        if (!useEditContext || !/^40[13] /.test((error as Error).message)) throw error
        console.warn("  WordPress refused the edit view for this user (check WP_USER / WP_APP_PASSWORD); using the public view.\n")
        useEditContext = false
        return fetchAll(path, {...params, lang})
      })
      for (const item of items) if (!seen.has(item.id)) seen.set(item.id, {item, language: languageOf(item, lang)})
    }
  }
  let all = [...seen.values()]
  if (ONLY_SLUG) all = all.filter(({item}) => item.slug === ONLY_SLUG)
  if (LIMIT === Infinity) return all

  // --limit: that many in the first language, plus their translations, so a
  // test shows the language versions linked up.
  const picked = all.filter((f) => f.language === LANGUAGES[0]).slice(0, LIMIT)
  const ids = new Set(picked.flatMap(({item}) => [item.id, ...translationIds(item)]))
  return all.filter(({item}) => ids.has(item.id) || translationIds(item).some((id) => ids.has(id)))
}

const title = (item: Obj) => decode(item.title?.rendered ?? item.title?.raw ?? '') || 'Untitled'

const isHeading = (block: Obj) => /^h[1-6]$/.test(block.style ?? '')

/**
 * A Practice Area's hero, from the page's own layout. When the first Container
 * holds the H1, it's the WordPress hero: its paragraphs become the Intro Text,
 * its first button the Hero Button and its image (or background image) the
 * Hero Image, and it's dropped from the body so it doesn't show twice.
 * Otherwise the first paragraph is copied as the intro and the body is kept.
 */
async function splitHero(pageBuilder: Obj[], where: string) {
  const blocksOf = (row: Obj) => row.columns.flatMap((c: Obj) => c.content as Obj[])
  const textOf = (blocks: Obj[]) => blocks.filter((b) => b._type === 'richTextBlock').flatMap((b) => b.content as Obj[])

  const first = pageBuilder[0]
  const firstBlocks = first ? blocksOf(first) : []
  if (first && textOf(firstBlocks).some((b) => b.style === 'h1')) {
    const intro = textOf(firstBlocks).filter((b) => b._type === 'block' && !isHeading(b))
    const button = firstBlocks.find((b) => b._type === 'callToAction')
    const image = firstBlocks.find((b) => b._type === 'imageBlock')?.image ?? (first.__background ? await imageField(first.__background) : null)
    return {
      intro,
      heroButton: button ? {label: button.label, link: button.link} : undefined,
      heroImage: image ?? undefined,
      body: pageBuilder.slice(1),
    }
  }
  const paragraph = textOf(pageBuilder.flatMap(blocksOf)).find((b) => b._type === 'block' && !isHeading(b) && !b.listItem)
  if (paragraph) note(where, 'Intro Text copied from the first paragraph, which also stays in the body: check it.')
  else note(where, 'No intro text found: write the Intro Text before publishing.')
  return {intro: paragraph ? [{...paragraph, _key: key()}] : [], body: pageBuilder}
}

/** Removes the import's working fields (__background) before anything is written. */
const clean = (rows: Obj[]) => rows.map(({__background, ...row}) => row)

async function buildPages(): Promise<{docs: Obj[]; fetched: Fetched[]}> {
  const fetched = await fetchInLanguages('/wp/v2/pages', {status: 'publish', _embed: 'wp:featuredmedia'})
  // The API lists a page's Page Types by id; the export file by slug.
  const practiceTypeIds = XML_FILE || JSON_FILES
    ? []
    : (await optional(() => fetchAll('/wp/v2/page-type'))).filter((t) => t.slug === PRACTICE_AREA_TYPE).map((t) => t.id)
  // The Page Type by slug (export file), by id (API), or as the page-type-…
  // class WordPress lists on every page (saved API responses).
  const tagged = (item: Obj) =>
    (item.pageTypes ?? []).includes(PRACTICE_AREA_TYPE) ||
    (item['page-type'] ?? []).some((id: number) => practiceTypeIds.includes(id)) ||
    (item.class_list ?? []).includes(`page-type-${PRACTICE_AREA_TYPE}`)

  // Practice Area → Office: the page's WordPress Location matched to Site
  // Settings' offices by name (location-manhattan → Manhattan).
  const offices: Obj[] = (await client.fetch('*[_id == "siteSettings"][0].footerOffices[]{_key, name}')) ?? []
  const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const officeOf = (item: Obj) => {
    const slugs: string[] = [
      ...(item.locationSlugs ?? []),
      ...(item.class_list ?? []).filter((c: string) => c.startsWith('location-')).map((c: string) => c.slice('location-'.length)),
    ]
    return offices.find((o) => slugs.includes(slugify(o.name ?? '')))?._key
  }
  const importedIds = new Set(fetched.map(({item}) => item.id))
  // A page is a Practice Area when it or any of its translations is tagged:
  // Polylang can translate the Page Type itself, so the Spanish one may differ.
  const practiceIds = new Set(fetched.filter(({item}) => tagged(item)).flatMap(({item}) => [item.id, ...translationIds(item)]))
  const isPracticeArea = (item: Obj) => practiceIds.has(item.id)

  const docs: Obj[] = []
  for (const {item, language} of fetched) {
    const practiceArea = isPracticeArea(item)
    const where = `${practiceArea ? 'practice area' : 'page'} ${item.slug} (${language})`
    console.log(`  ${where}`)
    const pageBuilder = await pageBuilderFor(item, where)
    if (item.parent && !importedIds.has(item.parent)) {
      note(where, `Its parent page (WordPress #${item.parent}) isn't in this import: import it too, or set the Parent Page in the Studio.`)
    }
    const common = {
      _id: `wp-page-${item.id}`,
      language,
      title: title(item),
      slug: {_type: 'slug', current: item.slug},
      ...(item.parent ? {parent: {_type: 'reference', _ref: `wp-page-${item.parent}`, _weak: true}} : {}),
      ...(item.date_gmt ? {publishedAt: `${item.date_gmt}Z`} : item.date ? {publishedAt: item.date} : {}),
      ...(item.modified_gmt ? {updatedAt: `${item.modified_gmt}Z`} : {}),
      seo: await seoFor(item),
    }
    if (!practiceArea) {
      docs.push({...common, _type: 'page', pageBuilder: clean(pageBuilder)})
      continue
    }
    // The hero's intro: the page's ACF Intro Text when it has one (plain text,
    // a blank line between paragraphs), else read from the layout.
    const introText: string = item.acf?.intro_text?.trim() ?? ''
    const hero = introText
      ? {
          intro: await richText(/<p[\s>]/.test(introText) ? introText : introText.split(/\n\s*\n/).map((p) => `<p>${p.trim()}</p>`).join('')),
          body: pageBuilder,
        }
      : await splitHero(pageBuilder, where)

    // The sidebar's Related Pages: ACF's list of page ids (an array from the
    // REST API, PHP-serialized in an export), kept to pages in this import.
    const relatedRaw = item.acf?.acf_related_pages
    const relatedIds: number[] = Array.isArray(relatedRaw)
      ? relatedRaw.map((r: Obj | number) => Number(typeof r === 'object' ? r.ID ?? r.id : r))
      : [...String(relatedRaw ?? '').matchAll(/s:\d+:"(\d+)"|i:\d+;i:(\d+)/g)].map((m) => Number(m[1] ?? m[2]))
    const relatedPages = relatedIds
      .filter((id) => importedIds.has(id) && id !== item.id)
      .map((id) => ({_type: 'reference', _key: key(), _ref: `wp-page-${id}`, _weak: true}))
    // The featured image; from a saved response without it embedded, Yoast's
    // share image, which is the featured image unless one was set apart.
    const featured = item._embedded?.['wp:featuredmedia']?.[0]
    const coverUrl = featured?.source_url ?? (item.featured_media ? item.yoast_head_json?.og_image?.[0]?.url : undefined)
    const coverImage = await imageField(coverUrl, featured?.alt_text)
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
      pageBuilder: clean(hero.body),
    })
  }
  return {docs, fetched}
}

async function buildPosts(): Promise<{docs: Obj[]; fetched: Fetched[]}> {
  // Categories: matched to the Studio's existing ones by slug, else created.
  const existing: Obj[] = await client.fetch('*[_type == "newsCategory" && !(_id in path("drafts.**"))]{_id, "slug": slug.current}')
  const bySlug = new Map(existing.map((c) => [c.slug, c._id]))
  const categories = JSON_FILES
    ? [] // A saved response lists category ids only, without their names.
    : XML_FILE
    ? loadXml().categories
    : // The REST route for the built-in "category" taxonomy is /categories.
      (await Promise.all(NEWS_TAXONOMIES.map((t) => optional(() => fetchAll(`/wp/v2/${t === 'category' ? 'categories' : t}`))))).flat()
  const categoryDocs: Obj[] = []
  const categoryId = new Map<number, string>()
  for (const cat of categories) {
    if (cat.slug === 'uncategorized') continue
    const id = bySlug.get(cat.slug) ?? `wp-category-${cat.id}`
    categoryId.set(cat.id, id)
    if (!bySlug.has(cat.slug)) {
      categoryDocs.push({_id: id, _type: 'newsCategory', title: decode(cat.name), slug: {_type: 'slug', current: cat.slug}})
    }
  }

  const fetched = XML_FILE || JSON_FILES
    ? await fetchInLanguages('/posts', {})
    : (
        await Promise.all(
          NEWS_TYPES.map((type) =>
            optional(() => fetchInLanguages(`/wp/v2/${type === 'post' ? 'posts' : type}`, {status: 'publish', _embed: 'wp:featuredmedia'})),
          ),
        )
      ).flat()
  const docs: Obj[] = [...categoryDocs]
  for (const {item, language} of fetched) {
    const where = `post ${item.slug} (${language})`
    console.log(`  ${where}`)
    const featured = item._embedded?.['wp:featuredmedia']?.[0]
    const coverImage = await imageField(featured?.source_url, featured?.alt_text)
    if (!coverImage) note(where, 'No featured image: add a Cover Image before publishing.')
    // The REST API lists a custom taxonomy's terms under its own name.
    const termIds = [...(item.categories ?? []), ...(item['news-category'] ?? [])]
    const category = termIds.map((id: number) => categoryId.get(id)).find(Boolean)
    docs.push({
      _id: `wp-post-${item.id}`,
      _type: 'newsPost',
      language,
      title: title(item),
      slug: {_type: 'slug', current: item.slug},
      ...(coverImage ? {coverImage} : {}),
      ...(category ? {category: {_type: 'reference', _ref: category}} : {}),
      ...(item.excerpt?.rendered ? {excerpt: decode(item.excerpt.rendered)} : {}),
      pageBuilder: clean(await pageBuilderFor(item, where)),
      // News dates are plain dates (news-post.ts).
      ...(item.date ? {publishedAt: item.date.slice(0, 10)} : {}),
      seo: await seoFor(item),
    })
  }
  return {docs, fetched}
}

/**
 * The item's language versions as [language, WordPress id] pairs, itself
 * included: from Polylang's translations map, or WPML's wpml_translations.
 */
function languageVersions(item: Obj, language: string): Array<[string, number]> {
  const pairs: Array<[string, number]> = [[language, item.id]]
  if (item.translations && typeof item.translations === 'object') {
    for (const [lang, id] of Object.entries(item.translations)) pairs.push([lang.slice(0, 2), Number(id)])
  } else if (Array.isArray(item.wpml_translations)) {
    for (const t of item.wpml_translations) pairs.push([String(t.locale ?? '').slice(0, 2), Number(t.id)])
  }
  // One per language, and only real ids.
  return [...new Map(pairs.filter(([lang, id]) => lang && id).map(([lang, id]) => [lang, id] as [string, number])).entries()]
}

/**
 * Links each set of language versions, as the Translations menu does (one
 * translation.metadata per set). The versions come from WordPress, so a page
 * is linked to its translation even when that one isn't in this import yet:
 * the link's id is the same whichever language is imported first, so the
 * later import fills in the same link rather than making a second one.
 */
function translationLinks(fetched: Fetched[], idPrefix: string, typeOf: (id: number) => string): Obj[] {
  const links = new Map<string, Obj>()
  for (const {item, language} of fetched) {
    const versions = languageVersions(item, language)
    if (versions.length < 2) continue
    const id = `wp-translation-${idPrefix}-${Math.min(...versions.map(([, v]) => v))}`
    if (links.has(id)) continue
    // A translation not imported yet is the same type as this one.
    const schemaType = typeOf(item.id)
    links.set(id, {
      _id: id,
      _type: 'translation.metadata',
      schemaTypes: [schemaType],
      translations: versions.map(([lang, wpId]) => ({
        _key: lang,
        _type: 'internationalizedArrayReferenceValue',
        language: lang,
        value: {_type: 'reference', _ref: `${idPrefix}-${wpId}`, _weak: true, _strengthenOnPublish: {type: schemaType}},
      })),
    })
  }
  return [...links.values()]
}

// --- Run --------------------------------------------------------------------

/**
 * --undo: deletes every document the import made — published and draft —
 * found by its wp- id (wp-page-12, drafts.wp-post-34, ...). Documents made in
 * the Studio, and the categories it matched instead of creating, are left
 * alone. Uploaded images are kept, so importing again reuses them.
 */
async function undo() {
  const {dataset} = client.config()
  const ids: string[] = await client.fetch('*[string::startsWith(_id, "wp-") || string::startsWith(_id, "drafts.wp-")]._id', {}, {perspective: 'raw'})
  if (!ids.length) return console.log(`Nothing to undo: no imported documents in "${dataset}".`)
  if (DRY_RUN) return console.log(`Dry run: would delete ${ids.length} imported documents from "${dataset}".`)
  // In one transaction per batch, links between them (a post and its
  // category, the translation links) are removed together.
  for (let i = 0; i < ids.length; i += 100) {
    const tx = client.transaction()
    for (const id of ids.slice(i, i + 100)) tx.delete(id)
    await tx.commit({visibility: 'async'})
  }
  console.log(`Deleted ${ids.length} imported documents from "${dataset}". Uploaded images were kept.`)
}

// sanity exec compiles to CommonJS, which has no top-level await.
async function main() {
  if (UNDO) return undo()
  if (XML_FILE) loadXml()
  if (JSON_FILES) loadJson()
  if (!WP_URL) throw new Error('Set WP_URL, e.g. WP_URL=https://thesandersfirm.com npm run import:wp -- --dry')
  mkdirSync(OUT_DIR, {recursive: true})
  const {dataset} = client.config()
  console.log(`${DRY_RUN ? 'Dry run: ' : ''}${XML_FILE ?? JSON_FILES?.join(', ') ?? WP_URL} → Sanity dataset "${dataset}"`)
  if (!WP_AUTH && !XML_FILE && !JSON_FILES) console.log("No WP_USER/WP_APP_PASSWORD: pages whose Elementor layout the site doesn't show publicly get their rendered HTML.\n")

  defaultFormCta = await client.fetch(
    'coalesce(*[_id == "siteSettings"][0].defaultBottomForm._ref, *[_type == "ctaForm" && coalesce(language, "en") == "en" && !(_id in path("drafts.**"))] | order(_createdAt asc)[0]._id)',
  )

  const docs: Obj[] = []
  if (ONLY !== 'posts') {
    console.log('Pages')
    const pages = await buildPages()
    // A page and its translation share a type (Page or Practice Area).
    const pageType = new Map(pages.docs.map((d) => [d._id, d._type]))
    docs.push(...pages.docs, ...translationLinks(pages.fetched, 'wp-page', (id) => pageType.get(`wp-page-${id}`) ?? 'page'))
  }
  if (ONLY !== 'pages') {
    console.log('Posts')
    const posts = await buildPosts()
    docs.push(...posts.docs, ...translationLinks(posts.fetched, 'wp-post', () => 'newsPost'))
  }

  // Pages already in Sanity (made in the Studio, not by an import) win: an
  // imported one at the same address would compete with them on the site.
  // Pages and Practice Areas share addresses; News posts have their own.
  if (!INCLUDE_EXISTING) {
    const existing: Obj[] = await client.fetch(
      `*[_type in ["page", "practiceArea", "newsPost"] && !(_id in path("drafts.**")) && !string::startsWith(_id, "wp-")]
        {_type, "slug": slug.current, "language": coalesce(language, "${DEFAULT_LANGUAGE}"), title}`,
    )
    const address = (type: string, slug: string, language: string) =>
      `${type === 'newsPost' ? 'news' : 'page'}:${language}:${slug}`
    const taken = new Map(existing.map((e) => [address(e._type, e.slug, e.language), e.title]))
    const skipped = new Set<string>()
    for (const doc of docs) {
      if (!['page', 'practiceArea', 'newsPost'].includes(doc._type)) continue
      const title = taken.get(address(doc._type, doc.slug.current, doc.language))
      if (title === undefined) continue
      skipped.add(doc._id)
      note(`${doc._type === 'newsPost' ? 'post' : 'page'} ${doc.slug.current} (${doc.language})`, `Skipped: Sanity already has "${title}" at this address (--include-existing imports it anyway).`)
    }
    // Translation links lose the skipped pages; one left with a single version links nothing.
    for (let i = docs.length - 1; i >= 0; i--) {
      const doc = docs[i]
      if (skipped.has(doc._id)) docs.splice(i, 1)
      else if (doc._type === 'translation.metadata') {
        doc.translations = doc.translations.filter((t: Obj) => !skipped.has(t.value._ref))
        if (doc.translations.length < 2) docs.splice(i, 1)
      }
    }
    if (skipped.size) console.log(`\nSkipped ${skipped.size} already in Sanity (see the report).`)
  }

  writeFileSync(join(OUT_DIR, 'documents.json'), JSON.stringify(docs, null, 2))
  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2))

  if (DRY_RUN) {
    console.log(`\nDry run: ${docs.length} documents saved to scripts/.wp-import/documents.json, nothing written.`)
  } else {
    // In batches, so one huge transaction doesn't hit the API's size limit.
    for (let i = 0; i < docs.length; i += 50) {
      const tx = client.transaction()
      for (const doc of docs.slice(i, i + 50)) {
        // Drafts, unless --publish: nothing shows on the site until it's
        // published in the Studio. Always published: the translation links,
        // as the Translations menu keeps them (they point at the published
        // ids), and News categories, which a post's category must be to be
        // referenced at all.
        const draft = !PUBLISH && !ALWAYS_PUBLISHED.has(doc._type)
        tx.createOrReplace({...doc, _id: draft ? `drafts.${doc._id}` : doc._id} as Obj & {_id: string; _type: string})
      }
      await tx.commit({visibility: 'async'})
    }
    console.log(
      `\nImported ${docs.length} documents into "${dataset}"${PUBLISH ? ', published' : ' as drafts: publish them in the Studio once checked'}.`,
    )
  }

  const notes = Object.entries(report)
  if (notes.length) {
    console.log(`\nTo rebuild by hand (also in scripts/.wp-import/report.json):`)
    for (const [where, messages] of notes) {
      console.log(`  ${where}`)
      for (const message of [...new Set(messages)]) console.log(`    - ${message}`)
    }
  }
  if (!LANGUAGES.includes(DEFAULT_LANGUAGE)) console.log(`\nNote: WP_LANGUAGES doesn't include "${DEFAULT_LANGUAGE}".`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
