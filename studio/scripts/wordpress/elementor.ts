/**
 * Elementor's layout → the Page Builder: each section (or top-level
 * container) becomes a Container, its columns become Columns, and each
 * widget becomes the block that matches it. A page not built with Elementor
 * becomes one Container holding its content as Rich Text.
 *
 * Only content comes over, not Elementor's styling (colors, spacing, fonts,
 * column widths). A widget with no block to match is noted in the report.
 */
import {JSDOM} from 'jsdom'
import type {WpItem} from './export-file'
import {imageField} from './images'
import {note, type Obj} from './options'
import {decode, key, linkItems, localHref, richText, richTextBlock} from './rich-text'
import {BOTTOM_CTA_TEMPLATES, LOOP_TEMPLATES, TEMPLATE_BANNERS} from './site-mappings'

/** The page being converted, for the report and for what depends on its type. */
export interface PageContext {
  /** How it's named in the report, e.g. "practice area slip-and-fall (en)". */
  where: string
  practiceArea: boolean
}

/** The Form CTA the "Bottom CTA" template becomes (set by the import before it starts). */
let bottomCtaForm: string | undefined
export const useBottomCtaForm = (id: string | undefined) => (bottomCtaForm = id)

// --- Widgets → blocks ---------------------------------------------------------

const block = (type: string, fields: Obj = {}) => ({_type: type, _key: key(), ...fields})
const textBlock = async (html: string) => {
  const b = richTextBlock(await richText(html))
  return b ? [b] : []
}

/** One Elementor widget as zero or more blocks. */
async function widgetBlocks(widget: Obj, page: PageContext): Promise<Obj[]> {
  const s: Obj = widget.settings ?? {}
  const type: string = widget.widgetType

  switch (type) {
    case 'heading': {
      // A "heading" set to a p/div/span tag is styled text, not a heading.
      const tag = /^h[1-6]$/.test(s.header_size) ? s.header_size : s.header_size ? 'p' : 'h2'
      return textBlock(`<${tag}>${s.title ?? ''}</${tag}>`)
    }
    case 'text-editor':
      return textBlock(s.editor)

    case 'icon-list': {
      const items = (s.icon_list ?? []).map((item: Obj) => {
        const href = localHref(item.link?.url)
        return `<li>${href ? `<a href="${href}">${item.text ?? ''}</a>` : (item.text ?? '')}</li>`
      })
      return textBlock(`<ul>${items.join('')}</ul>`)
    }

    case 'image': {
      const image = await imageField(s.image?.url, s.image?.alt)
      return image ? [block('imageBlock', {image, ...(s.caption ? {caption: s.caption} : {})})] : []
    }

    case 'button': {
      const label = decode(s.text ?? '')
      const link = linkItems(s.link, label)
      return label && link.length ? [block('callToAction', {label, variant: 'primary', link})] : []
    }

    case 'video': {
      const source = s.video_type || 'youtube'
      if (source === 'hosted') {
        const hostedUrl = s.hosted_url?.url ?? s.external_url?.url
        return hostedUrl ? [block('video', {source: 'hosted', hostedExternal: true, hostedUrl})] : []
      }
      const url = s[`${source}_url`] ?? s.youtube_url
      return url ? [block('video', {source, url, controls: true})] : []
    }

    // The newer accordion keeps its titles in settings and each panel's
    // content as a child container of widgets, in the same order.
    case 'nested-accordion': {
      const children: Obj[] = widget.elements ?? []
      const panels = []
      for (const [i, item] of (s.items ?? []).entries()) {
        const content: Obj[] = []
        for (const b of await blocksIn(children[i]?.elements, page)) {
          if (b._type === 'richTextBlock') content.push(...b.content)
          else note(page.where, `A ${b._type} inside accordion panel "${decode(item.item_title ?? '')}" not imported, add it in the Studio.`)
        }
        panels.push({_type: 'accordionPanel', _key: key(), title: decode(item.item_title ?? ''), content})
      }
      return panels.length
        ? [block('accordion', {panels, allowMultipleOpen: s.max_items_expended === 'multiple', firstOpenByDefault: s.default_state !== 'all_collapsed'})]
        : []
    }

    case 'accordion':
    case 'toggle': {
      const panels = []
      for (const tab of s.tabs ?? []) {
        panels.push({_type: 'accordionPanel', _key: key(), title: decode(tab.tab_title ?? ''), content: await richText(tab.tab_content)})
      }
      return panels.length ? [block('accordion', {panels, allowMultipleOpen: type === 'toggle'})] : []
    }

    case 'icon-box':
    case 'image-box': {
      const title = decode(s.title_text ?? '')
      if (!title) return []
      const icon = type === 'image-box' ? await imageField(s.image?.url, s.image?.alt) : null
      const linked = Boolean(s.link?.url)
      return [
        block('iconText', {
          title,
          ...(s.description_text ? {description: decode(s.description_text)} : {}),
          ...(icon ? {icon} : {}),
          ...(linked ? {link: {_type: 'callToAction', label: title, link: linkItems(s.link, title)}} : {}),
        }),
      ]
    }

    case 'counter':
      return [
        block('statMetric', {
          value: String(s.ending_number ?? ''),
          label: decode(s.title ?? ''),
          ...(s.prefix ? {prefix: s.prefix} : {}),
          ...(s.suffix ? {suffix: s.suffix} : {}),
        }),
      ]

    case 'testimonial': {
      const quote = decode(s.testimonial_content ?? '')
      const name = decode(s.testimonial_name ?? '')
      if (!quote || !name) return []
      const avatar = await imageField(s.testimonial_image?.url)
      return [block('testimonialQuote', {quote, name, ...(s.testimonial_job ? {title: decode(s.testimonial_job)} : {}), ...(avatar ? {avatar} : {})})]
    }

    case 'spacer':
      return [block('spacerDivider', {height: 'md', showDivider: false})]
    case 'divider':
      return [block('spacerDivider', {height: 'sm', showDivider: true})]

    case 'google_maps':
      return s.address ? [block('mapEmbed', {embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`})] : []

    case 'html':
      // The site's "Show More" toggles are page scripting, not content.
      if (/toggle-clamp-btn/.test(s.html ?? '') || !s.html?.trim()) return []
      return [block('htmlBlock', {html: s.html})]

    case 'template':
      return templateBlocks(String(s.template_id ?? ''), page)

    case 'loop-carousel':
    case 'loop-grid':
      return loopBlocks(LOOP_TEMPLATES[String(s.template_id)] ?? s.post_query_post_type, page)

    // Drawn by the site itself, or decoration (the row of review stars).
    case 'breadcrumbs':
    case 'icon':
      return []

    case 'uael-gf-styler':
    case 'form':
      note(page.where, 'A form: add a Form or Form CTA block.')
      return []

    default:
      note(page.where, `Widget "${type}" not imported, rebuild it in the Studio.`)
      return []
  }
}

/** A saved Elementor template placed on the page. */
function templateBlocks(id: string, page: PageContext): Obj[] {
  if (TEMPLATE_BANNERS[id]) return [block('ctaBanner', {banner: TEMPLATE_BANNERS[id]})]
  if (BOTTOM_CTA_TEMPLATES.has(id)) {
    // A Practice Area's template draws its own bottom form.
    if (page.practiceArea || !bottomCtaForm) return []
    return [block('formCta', {cta: {_type: 'reference', _ref: bottomCtaForm}})]
  }
  note(page.where, `Saved Elementor template #${id || '?'} not imported, rebuild it in the Studio.`)
  return []
}

/** An Elementor loop (a carousel or grid of posts), by what it lists. */
function loopBlocks(listing: string | undefined, page: PageContext): Obj[] {
  switch (listing) {
    // The Testimonial Carousel shows every Review when none are picked.
    case 'testimonials':
      return [block('testimonialCarousel')]
    case 'news':
      return [block('newsCards', {source: 'latest', count: 3})]
    // Drawn by the site itself: the sidebar's Related Pages, the search page.
    case 'related-pages':
    case 'search':
    case 'current_query':
      return []
    case 'case-result':
      note(page.where, 'A Case Results carousel: add a Case Results block and pick what it shows.')
      return []
    case 'attorneys':
      note(page.where, 'A Lawyer Cards carousel: add a Lawyer Cards block and pick what it shows.')
      return []
    default:
      note(page.where, `An Elementor loop of "${listing ?? 'posts'}" not imported, rebuild it in the Studio.`)
      return []
  }
}

/** Every widget inside some elements, in order: inner sections and nested containers flatten into the column. */
async function blocksIn(elements: Obj[] = [], page: PageContext): Promise<Obj[]> {
  const out: Obj[] = []
  for (const el of elements) {
    if (el.elType === 'widget') out.push(...(await widgetBlocks(el, page)))
    else if (isCard(el)) out.push(await card(el, page))
    else out.push(...(await blocksIn(el.elements, page)))
  }
  return out
}

// --- Cards ----------------------------------------------------------------------

/**
 * The boxed section most pages end on ("Discuss Your Case With…"): a container
 * with a background, opening with a heading over a divider. The attorney
 * profiles' Education, Bar Admission… boxes have the same shape but no
 * background, so they stay flat.
 */
const isCard = (el: Obj) =>
  el.elType === 'container' &&
  Boolean(el.settings?.background_background) &&
  el.elements?.[0]?.widgetType === 'heading' &&
  el.elements?.[1]?.widgetType === 'divider'

/** Elementor's padding ({top: '30', unit: 'px'…}) for one device, as the Advanced tab's spacing keys. */
function paddingSides(p: Obj | undefined, suffix = ''): Obj {
  if (!p) return {}
  const unit = p.unit || 'px'
  return Object.fromEntries(
    ['top', 'right', 'bottom', 'left'].filter((side) => p[side] !== '' && p[side] != null).map((side) => [`${side}${suffix}`, `${p[side]}${unit}`]),
  )
}

/**
 * A card as an Inner Container, spaced as Elementor draws it: padded as on
 * the site, items 20px apart (the container's gap), the heading with the
 * theme's H2 margins on top of that, and the divider just its line. The
 * heading is always an H2, though the site often tags it a <p> for styling.
 */
async function card(el: Obj, page: PageContext): Promise<Obj> {
  const [heading, ...rest] = el.elements
  const headingBlock = (await textBlock(`<h2>${heading.settings?.title ?? ''}</h2>`)).map((b) => ({
    ...b,
    blockStyles: {margin: {top: '30px', bottom: '20px', topMobile: '20px', bottomMobile: '10px', linked: false}},
  }))
  const content = [...headingBlock, ...(await blocksIn(rest, page))].map((b) =>
    b._type === 'spacerDivider' ? {...b, height: 'none', dividerColor: '#EDEDF4'} : b,
  )
  const s: Obj = el.settings
  const padding = {...paddingSides(s.padding), ...paddingSides(s.padding_mobile, 'Mobile')}
  const gap = Number(s.flex_gap?.size ?? s.flex_gap?.row ?? 20)
  return block('nestedContainer', {
    label: decode(heading.settings?.title ?? '').replace(/<[^>]+>/g, '').trim() || undefined,
    container: {layoutType: 'flex', contentWidth: 'full', direction: {desktop: 'column'}},
    layout: 'full',
    columns: [{...column(content), container: {...COLUMN_SETTINGS, gap: {desktop: {column: gap, row: gap, unit: 'px'}}}}],
    design: {background: {normal: {type: 'classic', color: '#ffffff'}}},
    ...(Object.keys(padding).length ? {advanced: {padding: {...padding, linked: s.padding?.isLinked !== false}}} : {}),
  })
}

// --- Containers and Columns ---------------------------------------------------

// The settings new Containers and Columns get in the Studio (as on About Us).
const CONTAINER_SETTINGS = {
  layoutType: 'flex',
  contentWidth: 'boxed',
  direction: {tablet: 'column'},
  gap: {desktop: {column: 40, row: 40, unit: 'px'}, mobile: {column: 16, row: 16, unit: 'px'}, linked: true},
}
const COLUMN_SETTINGS = {layoutType: 'flex', direction: {desktop: 'column'}, gap: {desktop: {column: 24, row: 24, unit: 'px'}}}

/**
 * Text that runs on (Elementor's heading, text, heading, text... widgets) as
 * one Rich Text block rather than one per widget, so it's edited in one place.
 */
function mergeText(content: Obj[]): Obj[] {
  const out: Obj[] = []
  for (const b of content) {
    const previous = out[out.length - 1]
    if (b._type === 'richTextBlock' && previous?._type === 'richTextBlock') previous.content = [...previous.content, ...b.content]
    else out.push(b)
  }
  return out
}

const column = (content: Obj[]) => ({_type: 'gridColumn', _key: key(), container: COLUMN_SETTINGS, content: mergeText(content)})
const container = (columns: Obj[], label?: string) => ({_type: 'gridRow', _key: key(), ...(label ? {label} : {}), container: CONTAINER_SETTINGS, columns})

/**
 * Elementor's elements → Containers. A section's columns become Columns, and
 * so do a container's child containers when that's all it holds (a row of
 * them). A container mixing widgets with inner containers is one flow down
 * the page, so it stays one Column with everything in order.
 */
async function containers(elements: Obj[], page: PageContext): Promise<Obj[]> {
  const rows: Obj[] = []
  for (const el of elements) {
    const children: Obj[] = el.elements ?? []
    const columnEls =
      el.elType === 'section'
        ? children.filter((c) => c.elType === 'column')
        : children.length > 1 && children.every((c) => c.elType === 'container')
          ? children
          : []

    // One at a time, so an image used twice is only uploaded once.
    const columns: Obj[] = []
    if (columnEls.length) for (const col of columnEls) columns.push(column(await blocksIn(col.elements, page)))
    else columns.push(column(await blocksIn(children, page)))

    const filled = columns.filter((c) => c.content.length > 0)
    if (!filled.length) continue
    // The background image is a candidate hero image for a Practice Area
    // (documents.ts); withoutWorkingFields removes it before writing.
    const background = el.settings?.background_image?.url
    rows.push({...container(filled, el.settings?._title), ...(background ? {__background: background} : {})})
  }
  return rows
}

/**
 * Content not built with Elementor: one Container, one Column, with the text
 * as Rich Text and YouTube/Vimeo embeds as Videos.
 */
async function plainContent(html: string, page: PageContext): Promise<Obj[]> {
  const doc = new JSDOM(`<!doctype html><body>${html}`).window.document
  const videos: Obj[] = []
  for (const iframe of Array.from(doc.querySelectorAll('iframe'))) {
    const src = iframe.getAttribute('src') ?? ''
    const source = /youtu/.test(src) ? 'youtube' : /vimeo/.test(src) ? 'vimeo' : null
    if (source) videos.push(block('video', {source, url: src, controls: true}))
    else note(page.where, `Embed not imported: ${src}`)
    iframe.remove()
  }
  for (const form of Array.from(doc.querySelectorAll('form'))) {
    note(page.where, 'A form was left out, add a Form or Form CTA block.')
    form.remove()
  }
  const text = richTextBlock(await richText(doc.body.innerHTML))
  const content = [...(text ? [text] : []), ...videos]
  return content.length ? [container([column(content)])] : []
}

/** A WordPress page or post's content as Page Builder Containers. */
export async function pageBuilderFor(item: WpItem, page: PageContext): Promise<Obj[]> {
  if (item.elementorData) {
    try {
      const elements = JSON.parse(item.elementorData)
      if (Array.isArray(elements) && elements.length) return containers(elements, page)
    } catch {
      note(page.where, "Elementor's layout couldn't be read, so the rendered HTML was used.")
    }
  }
  note(page.where, 'Not built with Elementor: imported its content as one Container.')
  return plainContent(item.content, page)
}

/** The Containers without the import's working fields (__background), ready to write. */
export const withoutWorkingFields = (rows: Obj[]) => rows.map(({__background, ...row}) => row)
