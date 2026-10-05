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

/** Every language but the default, each with its own /<id> section. */
export const OTHER_LANGUAGES = LANGUAGES.map((l) => l.id).filter(
  (id): id is Exclude<Language, typeof DEFAULT_LANGUAGE> => id !== DEFAULT_LANGUAGE,
)

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

/** The language whose section an address is in (/es/… is Spanish), or undefined for the default's. */
export function languageFromPath(path: string): Language | undefined {
  return OTHER_LANGUAGES.find((id) => path === `/${id}` || path.startsWith(`/${id}/`))
}

/** A language's home: / for the default, /es for the others. */
export function homePath(language?: string | null): string {
  const lang = languageOf(language)
  return lang === DEFAULT_LANGUAGE ? '/' : `/${lang}`
}

/**
 * A news post's address: /news/<slug>, /es/news/<slug> in Spanish. Without a
 * slug, the language's News list: /news, /es/news.
 */
export function newsPath(slug?: string | null, language?: string | null): string {
  const clean = stegaClean(slug)
  return clean ? localizedPath(clean, language, ['news']) : localizedPath('news', language)
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
    footer: 'Footer',
    search: 'Search',
    closeSearch: 'Close search',
    toggleMenu: 'Toggle menu',
    submenu: '{label} menu',
    pagination: 'Pagination',
    prevPage: '‹ Prev',
    nextPage: 'Next ›',
    page: 'Page {n}',
    previous: 'Previous',
    next: 'Next',
    close: 'Close',
    goToSlide: 'Go to slide {n}',
    playVideo: 'Play video',
    viewOn: 'View on {platform}',
    stars: '{rating} out of 5 stars',
    submit: 'Submit',
    sending: 'Sending...',
    formSuccess: 'Thank you! Your submission has been received.',
    formError: 'Something went wrong. Please try again.',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    eventEnded: 'This event has ended.',
    contentReviewedBy: 'Content Reviewed by:',
    dateLastUpdated: 'Date Last Updated:',
    tableOfContents: 'Table of Contents',
    untitled: 'Untitled',
    noContent: 'No content.',
    noAnswer: 'No answer provided.',
    Settlement: 'Settlement',
    Verdict: 'Verdict',
    Award: 'Award',
    news: 'News',
    noNews: 'No news yet.',
    allNews: '← All news',
    searchTitle: 'Search: {q}',
    searchHeading: 'Looking for something?',
    searchPlaceholder: 'Search articles and pages...',
    resultsFor: 'Results for “{q}”',
    noResults: 'Nothing matched “{q}”. Try fewer or different words.',
    oneResult: '{n} result',
    manyResults: '{n} results',
    resultPage: 'Page',
    resultPracticeArea: 'Practice Area',
    // A practice area's sidebar.
    officeLocation: 'Office Location',
    relatedPages: 'Related Pages',
    mapOf: 'Map of {place}',
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
    footer: 'Pie de página',
    search: 'Buscar',
    closeSearch: 'Cerrar búsqueda',
    toggleMenu: 'Abrir o cerrar el menú',
    submenu: 'Menú de {label}',
    pagination: 'Paginación',
    prevPage: '‹ Anterior',
    nextPage: 'Siguiente ›',
    page: 'Página {n}',
    previous: 'Anterior',
    next: 'Siguiente',
    close: 'Cerrar',
    goToSlide: 'Ir a la diapositiva {n}',
    playVideo: 'Reproducir video',
    viewOn: 'Ver en {platform}',
    stars: '{rating} de 5 estrellas',
    submit: 'Enviar',
    sending: 'Enviando...',
    formSuccess: '¡Gracias! Hemos recibido su mensaje.',
    formError: 'Algo salió mal. Inténtelo de nuevo.',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    eventEnded: 'Este evento ha terminado.',
    contentReviewedBy: 'Contenido revisado por:',
    dateLastUpdated: 'Última actualización:',
    tableOfContents: 'Índice',
    untitled: 'Sin título',
    noContent: 'Sin contenido.',
    noAnswer: 'Sin respuesta.',
    // Case result types, keyed by the value the Studio stores.
    Settlement: 'Acuerdo',
    Verdict: 'Veredicto',
    Award: 'Indemnización',
    news: 'Noticias',
    noNews: 'Aún no hay noticias.',
    allNews: '← Todas las noticias',
    searchTitle: 'Búsqueda: {q}',
    searchHeading: '¿Busca algo?',
    searchPlaceholder: 'Buscar artículos y páginas...',
    resultsFor: 'Resultados para “{q}”',
    noResults: 'No encontramos nada para “{q}”. Pruebe con menos palabras o con otras.',
    oneResult: '{n} resultado',
    manyResults: '{n} resultados',
    // Search results' labels for what each one is.
    resultPage: 'Página',
    resultPracticeArea: 'Área de práctica',
    // A practice area's sidebar.
    officeLocation: 'Ubicación de la oficina',
    relatedPages: 'Páginas relacionadas',
    mapOf: 'Mapa de {place}',
  },
} satisfies Record<Language, Record<string, string>>

export type UiWord = keyof (typeof UI)['en']

/**
 * A built-in word in a language, e.g. t('es', 'getDirections') -> 'Cómo llegar'.
 * {placeholders} are filled from `vars`: t('en', 'page', {n: 2}) -> 'Page 2'.
 */
export function t(
  language: Language | undefined,
  key: UiWord,
  vars?: Record<string, string | number>,
): string {
  const word = UI[language ?? DEFAULT_LANGUAGE][key]
  return vars ? word.replace(/\{(\w+)\}/g, (match, name) => String(vars[name] ?? match)) : word
}

/** A value from a fixed Studio list (e.g. a case result's type) in a language, or itself if unknown. */
export function label(language: Language | undefined, value: string | null | undefined): string {
  const clean = stegaClean(value ?? '')
  const words: Record<string, string> = UI[language ?? DEFAULT_LANGUAGE]
  return words[clean] ?? clean
}
