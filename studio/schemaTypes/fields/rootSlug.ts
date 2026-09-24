import {defineField, type SlugValidationContext} from 'sanity'

/** Document types served at /<slug>; a slug must be unique across all of them. */
export const ROOT_SLUG_TYPES = ['page', 'practiceArea']

/**
 * Paths the frontend serves itself, which a document would be hidden behind.
 * practice-areas and news aren't here: a page with either slug replaces the
 * built-in listing at that path.
 */
const RESERVED = ['api', '404', 'search']

async function isUniqueAtRoot(slug: string, context: SlugValidationContext) {
  if (RESERVED.includes(slug)) return false
  const id = context.document?._id.replace(/^drafts\./, '')
  if (!id) return true
  const client = context.getClient({apiVersion: '2025-03-20'})
  const taken = await client.fetch<boolean>(
    `defined(*[_type in $types && slug.current == $slug && !sanity::versionOf($id)][0]._id)`,
    {types: ROOT_SLUG_TYPES, slug, id},
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
    description: opts?.description ?? 'The page lives at /<slug>. It must not match any page or practice area.',
    options: {source: 'title', isUnique: isUniqueAtRoot},
    validation: (rule) => rule.required(),
  })
}
