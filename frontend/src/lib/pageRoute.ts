import type {AstroGlobal} from 'astro'
import {getClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {PAGE_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/lib/queries'
import {alternatesOf, type Language} from '@/lib/i18n'

/**
 * Loads a builder page (Page or Practice Area) by slug in one language, with
 * the site settings, for the page routes: /<slug> and /es/<slug>, plus their
 * /page/<n> list pages. Also records the language and the page's versions in
 * other languages, which the layout (lang, hreflang) and the header's
 * language link read.
 */
export async function loadPage(Astro: AstroGlobal, slug: string, language: Language) {
  const client = getClient(Astro.locals.isDraft)
  const [page, settings] = await Promise.all([
    sanityFetch(client, Astro.locals, PAGE_QUERY, {slug, language}),
    sanityFetch(client, Astro.locals, SITE_SETTINGS_QUERY),
  ])

  Astro.locals.language = language
  if (page) Astro.locals.alternates = alternatesOf(page, page.translations)

  return {page, settings}
}
