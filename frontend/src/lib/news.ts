import type {AstroGlobal} from 'astro'
import {stegaClean} from '@sanity/client/stega'
import {getClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {NEWS_LIST_QUERY, NEWS_POST_QUERY, PAGE_QUERY} from '@/sanity/lib/queries'
import {getSiteSettings} from '@/lib/siteSettings'
import {LANGUAGES, alternatesOf, languageOf, newsPath, type Alternates, type Language} from '@/lib/i18n'
import type {PageData, SiteSettings} from '@/types/sanity'
import type {NEWS_LIST_QUERY_RESULT, NEWS_POST_QUERY_RESULT, PAGE_QUERY_RESULT} from '@/sanity/types.generated'

/** How each language writes a date: August 6, 2025 / 6 de agosto de 2025. */
const DATE_LOCALES: Record<Language, string> = {en: 'en-US', es: 'es-US'}

/**
 * A post's date, in the language's words. Formatted from the plain date,
 * never through a Date in local time: a midnight UTC date read in New York
 * becomes the evening before, so a post dated August 6 would show August 5.
 */
export function postDate(value: string | null | undefined, language: Language | undefined): string | undefined {
  const raw = stegaClean(value)
  const match = raw && /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (!match) return undefined
  const [, y, m, d] = match
  return new Intl.DateTimeFormat(DATE_LOCALES[languageOf(language)], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))))
}

/**
 * A language's News list (news/index.astro, es/news/index.astro): its posts,
 * newest first, and the Site Settings. A top-level Studio page with the slug
 * "news" in that language replaces the built-in listing, so editors can build
 * it like any other page and link to it with Internal Link; pages called
 * "news" under a Parent Page live elsewhere, so they don't.
 *
 * Also records the language and the list in each language: every language
 * has one (/news, /es/news), unless the replacing page's translation lives
 * somewhere else.
 */
export async function resolveNewsList(
  Astro: AstroGlobal,
  language: Language,
): Promise<{page: PageData | undefined; posts: NEWS_LIST_QUERY_RESULT; settings: SiteSettings | null}> {
  const client = getClient(Astro.locals.isDraft)
  // Typed here, as in lib/pageRoute.ts: the fetch alone comes back untyped.
  const pagesPromise: Promise<PAGE_QUERY_RESULT> = sanityFetch(client, Astro.locals, PAGE_QUERY, {
    slug: 'news',
    language,
  })
  const [posts, settings, newsPages] = await Promise.all([
    sanityFetch(client, Astro.locals, NEWS_LIST_QUERY, {language}),
    getSiteSettings(Astro.locals, language),
    pagesPromise,
  ])
  const page = newsPages.find((candidate) => !candidate.parents?.some(Boolean))

  Astro.locals.language = language
  const lists: Alternates = Object.fromEntries(LANGUAGES.map((l) => [l.id, newsPath(undefined, l.id)]))
  Astro.locals.alternates = page ? {...lists, ...alternatesOf(page, page.translations)} : lists

  return {page, posts, settings}
}

/**
 * A news post in a language (news/[slug].astro, es/news/[slug].astro), or
 * null when there's none with that slug in it. Also records the language and
 * the post's versions in other languages, for the layout and the language link.
 */
export async function resolveNewsPost(
  Astro: AstroGlobal,
  slug: string | undefined,
  language: Language,
): Promise<{post: NonNullable<NEWS_POST_QUERY_RESULT>; settings: SiteSettings | null} | null> {
  if (!slug) return null
  const client = getClient(Astro.locals.isDraft)
  const [post, settings] = await Promise.all([
    sanityFetch(client, Astro.locals, NEWS_POST_QUERY, {slug, language}),
    getSiteSettings(Astro.locals, language),
  ])
  if (!post) return null

  Astro.locals.language = language
  const alternates: Alternates = {}
  for (const version of [...(post.translations ?? []), post]) {
    const versionSlug = stegaClean(version?.slug)
    if (versionSlug) alternates[languageOf(version?.language)] = newsPath(versionSlug, version?.language)
  }
  Astro.locals.alternates = alternates

  return {post, settings}
}
