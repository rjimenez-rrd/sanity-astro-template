import type {AstroGlobal} from 'astro'
import {stegaClean} from '@sanity/client/stega'
import {getClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {SEARCH_QUERY} from '@/sanity/lib/queries'
import {getSiteSettings} from '@/lib/siteSettings'
import {LANGUAGES, localizedPath, newsPath, t, type Language} from '@/lib/i18n'
import type {SiteSettings} from '@/types/sanity'
import type {SEARCH_QUERY_RESULT} from '@/sanity/types.generated'

export type SearchResult = SEARCH_QUERY_RESULT[number]

/** A language's search page: /search, /es/search. */
export const searchPath = (language?: Language) => localizedPath('search', language)

/** Where a result lives: pages and practice areas at their address, news under /news. */
export function resultHref(result: SearchResult): string {
  const slug = stegaClean(result.slug)
  return stegaClean(result._type) === 'newsPost'
    ? newsPath(slug, result.language)
    : localizedPath(slug, result.language, result.parents)
}

/** What a result is, in the language: Page, Practice Area, News. */
export function resultLabel(result: SearchResult, language: Language): string {
  const type = stegaClean(result._type)
  if (type === 'practiceArea') return t(language, 'resultPracticeArea')
  if (type === 'newsPost') return t(language, 'news')
  return t(language, 'resultPage')
}

/**
 * A language's search page (search.astro, es/search.astro): the query from
 * ?q=, what it found in that language, and the Site Settings. Also records
 * the language and the same search in each language, for the language link.
 */
export async function resolveSearch(
  Astro: AstroGlobal,
  language: Language,
): Promise<{q: string; results: SEARCH_QUERY_RESULT; settings: SiteSettings | null}> {
  const client = getClient(Astro.locals.isDraft)

  const q = (Astro.url.searchParams.get('q') ?? '').trim().slice(0, 100)
  // Each word must match, as a prefix: "car acc" finds "Car Accident".
  // GROQ's match treats a few characters as syntax, so they're stripped first.
  const terms = q
    .replace(/[*"\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}*`)

  const [results, settings] = await Promise.all([
    terms.length > 0
      ? sanityFetch(client, Astro.locals, SEARCH_QUERY, {terms, language})
      : Promise.resolve([] as SEARCH_QUERY_RESULT),
    getSiteSettings(Astro.locals, language),
  ])

  Astro.locals.language = language
  // Switching language keeps the words searched for.
  const query = q ? `?${new URLSearchParams({q})}` : ''
  Astro.locals.alternates = Object.fromEntries(LANGUAGES.map((l) => [l.id, searchPath(l.id) + query]))

  return {q, results, settings}
}
