import {stegaClean} from '@sanity/client/stega'

/**
 * The site's languages, mirroring studio/schemaTypes/languages.ts. The first
 * is the default: its pages live at the root (/about-us), every other
 * language under its id (/es/sobre-nosotros).
 */
export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Español'},
] as const

export type Language = (typeof LANGUAGES)[number]['id']

export const DEFAULT_LANGUAGE: Language = 'en'

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((l) => l.id === value)
}

/** A document's language; ones from before languages existed are the default. */
export function languageOf(value: string | null | undefined): Language {
  const clean = stegaClean(value)
  return isLanguage(clean) ? clean : DEFAULT_LANGUAGE
}

/** /about-us in the default language, /es/sobre-nosotros in the others. */
export function localizedPath(slug: string, language?: string | null): string {
  const lang = languageOf(language)
  return lang === DEFAULT_LANGUAGE ? `/${slug}` : `/${lang}/${slug}`
}

/** A language's home: / for the default, /es for the others. */
export function homePath(language?: string | null): string {
  const lang = languageOf(language)
  return lang === DEFAULT_LANGUAGE ? '/' : `/${lang}`
}

/**
 * The same page in each language that has it, as paths keyed by language:
 * {en: '/about-us', es: '/es/sobre-nosotros'}. Built from the page's own slug
 * plus its translations, and read by the header's language link and the
 * hreflang tags.
 */
export type Alternates = Partial<Record<Language, string>>

export function alternatesOf(
  page: {language?: string | null; slug?: {current?: string | null} | string | null},
  translations?: Array<{language?: string | null; slug?: string | null} | null> | null,
): Alternates {
  const out: Alternates = {}
  for (const t of translations ?? []) {
    const slug = stegaClean(t?.slug)
    if (slug) out[languageOf(t?.language)] = localizedPath(slug, t?.language)
  }
  const own = typeof page.slug === 'string' ? page.slug : page.slug?.current
  const slug = stegaClean(own)
  if (slug) out[languageOf(page.language)] = localizedPath(slug, page.language)
  return out
}
