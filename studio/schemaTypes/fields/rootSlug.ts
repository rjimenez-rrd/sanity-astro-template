import {defineField, type SlugValidationContext} from 'sanity'
import {DEFAULT_LANGUAGE, LANGUAGES} from '../languages'

/**
 * Document types served from their slug: /<slug>, or under a Parent Page
 * (/<parent>/<slug>), and /es/… in Spanish. They can be each other's parents.
 */
export const ROOT_SLUG_TYPES = ['page', 'practiceArea']

/**
 * How many pages deep a page can sit under others: /a/b/c/d is a page with
 * three ancestors. Queries follow the chain to exactly this depth (frontend
 * queries.ts PARENTS_FRAGMENT), so it can't grow without them.
 */
export const MAX_ANCESTORS = 3

/**
 * Top-level paths the frontend serves itself, which a top-level document would
 * be hidden behind. practice-areas and news aren't here: a page with either
 * slug replaces the built-in listing at that path. Only the top level: under a
 * parent, /about-us/search is free.
 */
const RESERVED = ['api', '404', 'search', 'preview', ...LANGUAGES.map((l) => l.id)]

const refId = (doc: SlugValidationContext['document']) =>
  (doc?.parent as {_ref?: string} | undefined)?._ref

/**
 * A slug must be unique among its siblings: same parent (or none), same
 * language. /about-us/faq and /services/faq can both exist; so can an English
 * and a Spanish page with the same slug.
 */
async function isUniqueAmongSiblings(slug: string, context: SlugValidationContext) {
  const parent = refId(context.document) ?? ''
  if (!parent && RESERVED.includes(slug)) return false
  const id = context.document?._id.replace(/^drafts\./, '')
  if (!id) return true
  // Documents from before languages existed have none; they're the default.
  const language = (context.document?.language as string | undefined) ?? DEFAULT_LANGUAGE
  const client = context.getClient({apiVersion: '2025-03-20'})
  const taken = await client.fetch<boolean>(
    `defined(*[_type in $types && slug.current == $slug && !sanity::versionOf($id)
      && coalesce(language, $defaultLanguage) == $language
      && coalesce(parent._ref, "") == $parent][0]._id)`,
    {types: ROOT_SLUG_TYPES, slug, id, language, defaultLanguage: DEFAULT_LANGUAGE, parent},
  )
  return !taken
}

/** Slug for a page served at /<parents>/<slug>. */
export function rootSlugField(opts?: {group?: string; description?: string}) {
  return defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    group: opts?.group,
    description:
      opts?.description ??
      'The last part of the address: /<slug>, or /<parent>/<slug> with a Parent Page (Spanish: /es/…). It must not match another page with the same parent.',
    options: {source: 'title', isUnique: isUniqueAmongSiblings},
    validation: (rule) => rule.required(),
  })
}

/**
 * Parent Page: puts this page under another in the site's addresses and
 * breadcrumbs — About Us → Our Team is /about-us/our-team. Optional; without
 * it the page sits at the top level.
 */
export function parentPageField(opts?: {group?: string}) {
  return defineField({
    name: 'parent',
    title: 'Parent Page',
    type: 'reference',
    group: opts?.group,
    to: ROOT_SLUG_TYPES.map((type) => ({type})),
    description:
      'Optional. Puts this page under another one: its address becomes /<parent>/<slug> and breadcrumbs show the path. Up to 3 levels deep.',
    options: {
      // Only pages in the same language, and never the page itself.
      filter: ({document}) => ({
        filter: '_id != $id && coalesce(language, $defaultLanguage) == $language',
        params: {
          id: document._id.replace(/^drafts\./, ''),
          language: (document.language as string | undefined) ?? DEFAULT_LANGUAGE,
          defaultLanguage: DEFAULT_LANGUAGE,
        },
      }),
    },
    validation: (rule) =>
      rule.custom(async (value, context) => {
        const parentId = (value as {_ref?: string} | undefined)?._ref
        if (!parentId) return true
        const id = context.document?._id.replace(/^drafts\./, '')
        const client = context.getClient({apiVersion: '2025-03-20'})
        // The chosen parent and its own ancestors, nearest first.
        const chain = await client.fetch<Array<string | null>>(
          `*[_id == $parentId][0]{"c": [_id, parent._ref, parent->parent._ref, parent->parent->parent._ref]}.c`,
          {parentId},
        )
        const ancestors = (chain ?? []).filter(Boolean)
        if (id && ancestors.includes(id)) return 'A page can’t be placed under itself or one of its own subpages.'
        if (ancestors.length > MAX_ANCESTORS) {
          return `Too deep: pages can sit at most ${MAX_ANCESTORS} levels under others.`
        }
        return true
      }),
  })
}
