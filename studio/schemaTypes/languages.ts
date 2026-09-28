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
export const TRANSLATED_TYPES = ['page', 'practiceArea']
