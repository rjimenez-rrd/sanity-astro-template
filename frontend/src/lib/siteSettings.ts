import {stegaClean} from '@sanity/client/stega'
import {getClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {
  PAGE_TRANSLATIONS_QUERY,
  SITE_SETTINGS_ES_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries'
import {DEFAULT_LANGUAGE, homePath, localizedPath, languageOf, type Language, type Parents} from '@/lib/i18n'
import type {SiteSettings} from '@/types/sanity'

/**
 * Site Settings in a language. English is Site Settings as-is. For Spanish,
 * each field set in Site Settings (Español) replaces the English one and
 * anything left empty keeps the English, so nothing shows blank while it's
 * being translated. Then every menu link to an English page that has a
 * Spanish version is pointed at that version: /about-us -> /es/sobre-nosotros.
 */
export async function getSiteSettings(
  locals: App.Locals,
  language: Language = DEFAULT_LANGUAGE,
): Promise<SiteSettings | null> {
  const client = getClient(locals.isDraft)
  if (language === DEFAULT_LANGUAGE) return withPageLinks(await sanityFetch(client, locals, SITE_SETTINGS_QUERY))

  const [english, spanish, translations] = await Promise.all([
    sanityFetch(client, locals, SITE_SETTINGS_QUERY),
    sanityFetch(client, locals, SITE_SETTINGS_ES_QUERY),
    sanityFetch(client, locals, PAGE_TRANSLATIONS_QUERY),
  ])
  if (!english) return null

  const merged = {...english} as Record<string, unknown>
  for (const [key, value] of Object.entries(spanish ?? {})) {
    if (isSet(value)) merged[key] = value
  }
  // The language link on a Spanish page is its own ("English"), never the
  // English settings' "Spanish" link.
  merged.headerExtraLink = spanish?.headerExtraLink ?? null

  const localize = pathTranslator(translations ?? [], language)
  // Picked pages first: a Spanish page's address is already /es/…; an English
  // one (a menu left to the English settings) is then switched by localize.
  const settings = withPageLinks(merged as SiteSettings) as SiteSettings
  // Only hrefs change, so the shape is still SiteSettings; TypeScript can't
  // follow that through the rebuilt menu union, hence the cast.
  return {
    ...settings,
    mainNav: settings.mainNav?.map((item) => ({
      ...item,
      href: localize(item.href),
      ...('items' in item && item.items
        ? {items: item.items.map((child) => ({...child, href: localize(child.href)}))}
        : {}),
    })),
    footerNav: settings.footerNav?.map((link) => ({...link, href: localize(link.href)})) ?? null,
    footerLegalLinks:
      settings.footerLegalLinks?.map((link) => ({...link, href: localize(link.href)})) ?? null,
  } as SiteSettings
}

type PickedPage = {_type?: string | null; slug?: string | null; language?: string | null; parents?: Parents} | null

/** A picked Page's address: /slug, /parent/slug, /es/…, or the home page. */
function pageHref(page: PickedPage | undefined): string | undefined {
  if (!page) return undefined
  if (stegaClean(page._type) === 'homePage') return homePath(page.language)
  const slug = stegaClean(page.slug)
  return slug ? localizedPath(slug, page.language, page.parents) : undefined
}

/**
 * Menu links whose Page is picked get that page's address as their href;
 * the rest keep their Custom Link.
 */
function withPageLinks(settings: SiteSettings | null): SiteSettings | null {
  if (!settings?.mainNav) return settings
  const link = <T extends {href?: string | null; page?: PickedPage}>(item: T): T => ({
    ...item,
    href: pageHref(item.page) ?? item.href,
  })
  return {
    ...settings,
    mainNav: settings.mainNav.map((item) => ({
      ...link(item),
      ...('items' in item && item.items ? {items: item.items.map(link)} : {}),
    })),
  } as SiteSettings
}

/** Filled in: not null, not an empty string, not an empty list. */
function isSet(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return stegaClean(value).trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Maps a default-language page path to its version in `language`, when there
 * is one. Anything else — external links, other pages, a path already in the
 * right language — comes back unchanged.
 */
function pathTranslator(
  sets: Array<{
    pages: Array<{language: string | null; slug: string | null; parents?: Array<string | null> | null} | null> | null
  }>,
  language: Language,
) {
  const map = new Map<string, string>()
  const unprefixed: Array<[string, string]> = []
  for (const {pages} of sets) {
    const from = pages?.find((p) => languageOf(p?.language) === DEFAULT_LANGUAGE && p?.slug)
    const to = pages?.find((p) => languageOf(p?.language) === language && p?.slug)
    if (from?.slug && to?.slug) {
      map.set(
        localizedPath(stegaClean(from.slug), DEFAULT_LANGUAGE, from.parents),
        localizedPath(stegaClean(to.slug), language, to.parents),
      )
    }
    // The translation's own slug typed without its prefix (/acerca-nosotros in
    // a Spanish menu) would otherwise be a root path that doesn't exist.
    if (to?.slug) {
      unprefixed.push([
        localizedPath(stegaClean(to.slug), DEFAULT_LANGUAGE, to.parents),
        localizedPath(stegaClean(to.slug), language, to.parents),
      ])
    }
  }
  // Only where no default-language page has that path (a practice area can
  // share its slug across languages; the mapping above already covers it).
  for (const [from, to] of unprefixed) if (!map.has(from)) map.set(from, to)
  return <T extends string | null | undefined>(href: T): T => {
    const clean = stegaClean(href ?? '')
    const path = clean.replace(/\/+$/, '') || '/'
    return (map.get(path) as T) ?? href
  }
}
