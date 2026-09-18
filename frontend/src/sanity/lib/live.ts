import type {SanityClient, QueryParams} from '@sanity/client'

/**
 * Fetches a query and records the sync tags the Live Content API attaches to
 * it, so the page can listen for changes to exactly this content. Collected
 * on `Astro.locals` and rendered by <SanityLive />.
 */
export async function sanityFetch<Q extends string>(
  client: SanityClient,
  locals: App.Locals,
  query: Q,
  params: QueryParams = {},
) {
  const response = await client.fetch(query, params, {filterResponse: false})
  for (const tag of response.syncTags ?? []) {
    if (!locals.syncTags.includes(tag)) locals.syncTags.push(tag)
  }
  return response.result
}
