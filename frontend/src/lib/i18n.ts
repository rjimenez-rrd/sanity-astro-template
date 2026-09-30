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

/** Ancestors' slugs under a Parent Page, root first; nulls mark where the chain ends. */
export type Parents = Array<string | null | undefined> | null | undefined

/**
 * A page's address: /about-us, or under Parent Pages /about-us/our-team, and
 * the same under /es for Spanish. `parents` is the page's ancestors' slugs,
 * root first, as the queries' PARENTS_FRAGMENT returns them.
 */
export function localizedPath(slug: string, language?: string | null, parents?: Parents): string {
  const lang = languageOf(language)
  const path = [...(parents ?? []).map((p) => stegaClean(p)).filter(Boolean), stegaClean(slug)].join('/')
  return lang === DEFAULT_LANGUAGE ? `/${path}` : `/${lang}/${path}`
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
  page: {language?: string | null; slug?: {current?: string | null} | string | null; parents?: Parents},
  translations?: Array<{language?: string | null; slug?: string | null; parents?: Parents} | null> | null,
): Alternates {
  const out: Alternates = {}
  for (const t of translations ?? []) {
    const slug = stegaClean(t?.slug)
    if (slug) out[languageOf(t?.language)] = localizedPath(slug, t?.language, t?.parents)
  }
  const own = typeof page.slug === 'string' ? page.slug : page.slug?.current
  const slug = stegaClean(own)
  if (slug) out[languageOf(page.language)] = localizedPath(slug, page.language, page.parents)
  return out
}

/**
 * Words written into the site's code rather than set in the Studio, per
 * language. Everything editors write lives in Site Settings and the pages.
 */
const UI = {
  en: {
    getDirections: 'Get Directions',
    pageNotFound: 'Page not found',
    pageNotFoundText: 'The page you are looking for does not exist or has been moved.',
    backHome: 'Back to home',
    switchToDefault: 'English',
    showMore: 'Show More',
    showLess: 'Show Less',
    home: 'Home',
    breadcrumb: 'Breadcrumb',
    Settlement: 'Settlement',
    Verdict: 'Verdict',
    Award: 'Award',
  },
  es: {
    getDirections: 'Cómo llegar',
    pageNotFound: 'Página no encontrada',
    pageNotFoundText: 'La página que busca no existe o se ha movido.',
    backHome: 'Volver al inicio',
    switchToDefault: 'English',
    showMore: 'Ver más',
    showLess: 'Ver menos',
    home: 'Inicio',
    breadcrumb: 'Ruta de navegación',
    // Case result types, keyed by the value the Studio stores.
    Settlement: 'Acuerdo',
    Verdict: 'Veredicto',
    Award: 'Indemnización',
  },
} satisfies Record<Language, Record<string, string>>

/** A built-in word in a language, e.g. t('es', 'getDirections') -> 'Cómo llegar'. */
export function t(language: Language | undefined, key: keyof (typeof UI)['en']): string {
  return UI[language ?? DEFAULT_LANGUAGE][key]
}

/** A value from a fixed Studio list (e.g. a case result's type) in a language, or itself if unknown. */
export function label(language: Language | undefined, value: string | null | undefined): string {
  const clean = stegaClean(value ?? '')
  const words: Record<string, string> = UI[language ?? DEFAULT_LANGUAGE]
  return words[clean] ?? clean
}

/** The screen-reader label for a star rating, e.g. "4 out of 5 stars". */
export function starsLabel(language: Language | undefined, rating: number): string {
  return (language ?? DEFAULT_LANGUAGE) === 'es' ? `${rating} de 5 estrellas` : `${rating} out of 5 stars`
}
