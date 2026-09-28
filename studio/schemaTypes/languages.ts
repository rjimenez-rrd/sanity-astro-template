/**
 * The site's languages. The first is the default: its pages live at the root
 * (/about-us), every other language under its id (/es/sobre-nosotros). Keep
 * in step with the frontend's lib/i18n.ts.
 */
export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'es', title: 'Spanish'},
] as const

export const DEFAULT_LANGUAGE = LANGUAGES[0].id

/** Document types that have a version per language. */
export const TRANSLATED_TYPES = ['page', 'practiceArea', 'homePage']

/**
 * The Home Page is a singleton, so each language's version has a fixed id
 * rather than the random one a new translation would get: the Studio opens it
 * from the sidebar, the site serves it at / and /es.
 */
export const HOME_PAGE_IDS: Record<string, string> = {
  en: 'homePage',
  es: 'homePage-es',
}
