import type {AstroGlobal} from 'astro'
import {stegaClean} from '@sanity/client/stega'
import {getClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {PAGE_QUERY} from '@/sanity/lib/queries'
import {getSiteSettings} from '@/lib/siteSettings'
import {alternatesOf, localizedPath, type Language} from '@/lib/i18n'
import {findPaginatedList, pageCount} from '@/lib/pagination'
import type {PageData, SiteSettings} from '@/types/sanity'
import type {PAGE_QUERY_RESULT} from '@/sanity/types.generated'

export type PageRoute =
  | {kind: 'page'; page: PageData; settings: SiteSettings | null; listPage?: number}
  | {kind: 'redirect'; to: string}
  | {kind: 'notFound'}

const clean = (parents: PageData['parents'] | null | undefined) =>
  (parents ?? []).map((p) => stegaClean(p)).filter((p): p is string => Boolean(p))

/**
 * What a builder-page address (Page or Practice Area) shows, in one language,
 * for the catch-all routes [...slug].astro and es/[...slug].astro:
 *
 * 1. The page at that exact address: /about-us/our-team is "our-team" whose
 *    Parent Page is "about-us" (and that one has no parent).
 * 2. A later page of a page's paginated card list: /about-us/page/2. A path,
 *    not ?page=2, because Vercel's ISR cache ignores query strings.
 * 3. An address a page has moved away from — e.g. /our-team, from before it
 *    got a Parent Page — redirects permanently to where it is now, so old
 *    links and search results keep working.
 *
 * Also records the language and the page's versions in other languages, which
 * the layout (lang, hreflang) and the header's language link read.
 */
export async function resolvePage(
  Astro: AstroGlobal,
  path: string | undefined,
  language: Language,
): Promise<PageRoute> {
  const segments = (path ?? '').split('/').filter(Boolean)
  if (segments.length === 0) return {kind: 'notFound'}

  const client = getClient(Astro.locals.isDraft)
  const settingsPromise = getSiteSettings(Astro.locals, language)

  /** Every page with this address's last slug, and the one whose parents match the rest. */
  const find = async (parts: string[]) => {
    // Typed here: the query's text is too long for its generated type to be
    // matched automatically, so the fetch alone comes back untyped.
    const candidates: PAGE_QUERY_RESULT = await sanityFetch(client, Astro.locals, PAGE_QUERY, {
      slug: parts[parts.length - 1],
      language,
    })
    const wanted = parts.slice(0, -1).join('/')
    const page = candidates.find((c) => clean(c.parents).join('/') === wanted)
    return {page, candidates}
  }

  const found = (page: PageData, settings: SiteSettings | null, listPage?: number): PageRoute => {
    Astro.locals.language = language
    Astro.locals.alternates = alternatesOf(page, page.translations)
    if (listPage) Astro.locals.listPage = listPage
    return {kind: 'page', page, settings, listPage}
  }

  const [{page, candidates}, settings] = await Promise.all([find(segments), settingsPromise])
  if (page) return found(page, settings)

  // /<page>/page/<n>. Only canonical numbers: "2", never "02", "2.0" or "abc".
  const last = segments[segments.length - 1]
  if (segments.length >= 3 && segments[segments.length - 2] === 'page' && /^\d+$/.test(last)) {
    const n = Number(last)
    const base = segments.slice(0, -2)
    const list = await find(base)
    if (list.page && String(n) === last && n >= 1) {
      // Page 1 has one address: the page's own.
      if (n === 1) return {kind: 'redirect', to: localizedPath(base[base.length - 1], language, base.slice(0, -1))}
      const paginated = findPaginatedList(list.page.pageBuilder)
      if (paginated && n <= pageCount(paginated.items, paginated.perPage)) {
        return found(list.page, settings, n)
      }
    }
  }

  // Moved: exactly one page has this slug, just not at this address.
  if (candidates.length === 1) {
    const [moved] = candidates
    const to = localizedPath(stegaClean(moved.slug?.current) ?? last, language, moved.parents)
    if (to !== localizedPath(last, language, segments.slice(0, -1))) return {kind: 'redirect', to}
  }

  return {kind: 'notFound'}
}
