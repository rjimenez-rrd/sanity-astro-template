import type {SanityClient} from '@sanity/client'
import {sanityClient} from 'sanity:client'
import {apiVersion, studioUrl} from './env'

/**
 * The shared, CDN-backed client configured in astro.config.mjs.
 *
 * The cast bridges two installed copies of @sanity/client: `sanity:client` is
 * typed against the one @sanity/astro resolves, while `sanity typegen` writes
 * its SanityQueries map into the one this workspace depends on. Same runtime
 * object either way, but without the cast every fetch() loses its result type.
 */
export const client = sanityClient as unknown as SanityClient

/** Name of the cookie the draft-mode endpoints set and middleware reads. */
export const DRAFT_COOKIE = '__sanity_draft'

/**
 * Client for the current request.
 *
 * Draft requests bypass the CDN, read the `drafts` perspective and turn stega
 * on so Presentation can map rendered text back to Studio fields. Published
 * requests keep the CDN and stay stega-free.
 */
export function getClient(isDraft: boolean): SanityClient {
  if (!isDraft) return client

  const token = import.meta.env.SANITY_API_READ_TOKEN
  if (!token) throw new Error('SANITY_API_READ_TOKEN is required for draft mode')

  return client.withConfig({
    apiVersion,
    token,
    useCdn: false,
    perspective: 'drafts',
    stega: {enabled: true, studioUrl},
  })
}

/** Draft client for endpoints that need one before a request is classified. */
export function getDraftClient(token: string): SanityClient {
  if (!token) throw new Error('SANITY_API_READ_TOKEN is required for draft mode')

  return client.withConfig({apiVersion, token, useCdn: false, perspective: 'drafts'})
}
