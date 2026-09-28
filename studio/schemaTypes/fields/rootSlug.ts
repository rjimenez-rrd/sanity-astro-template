import {defineField, type SlugValidationContext} from 'sanity'
import {DEFAULT_LANGUAGE, LANGUAGES} from '../languages'

/**
 * Document types served at /<slug> (or /<language>/<slug>); a slug must be
 * unique across all of them within one language, so an English and a Spanish
 * page may share one.
 */
export const ROOT_SLUG_TYPES = ['page', 'practiceArea']

/**
 * Paths the frontend serves itself, which a document would be hidden behind.
 * practice-areas and news aren't here: a page with either slug replaces the
 * built-in listing at that path.
 */
const RESERVED = ['api', '404', 'search', ...LANGUAGES.map((l) => l.id)]

async function isUniqueAtRoot(slug: string, context: SlugValidationContext) {
  if (RESERVED.includes(slug)) return false
  const id = context.document?._id.replace(/^drafts\./, '')
  if (!id) return true
  // Documents from before languages existed have none; they're the default.
  const language = (context.document?.language as string | undefined) ?? DEFAULT_LANGUAGE
  const client = context.getClient({apiVersion: '2025-03-20'})
  const taken = await client.fetch<boolean>(
    `defined(*[_type in $types && slug.current == $slug && !sanity::versionOf($id)
      && coalesce(language, $defaultLanguage) == $language][0]._id)`,
    {types: ROOT_SLUG_TYPES, slug, id, language, defaultLanguage: DEFAULT_LANGUAGE},
  )
  return !taken
}

/** Slug for a document served at /<slug>. */
export function rootSlugField(opts?: {group?: string; description?: string}) {
  return defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    group: opts?.group,
    description:
      opts?.description ??
      'The page lives at /<slug> (Spanish: /es/<slug>). It must not match another page or practice area in the same language.',
    options: {source: 'title', isUnique: isUniqueAtRoot},
    validation: (rule) => rule.required(),
  })
}
