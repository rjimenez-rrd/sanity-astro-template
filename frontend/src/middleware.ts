import {defineMiddleware} from 'astro:middleware'
import {DRAFT_COOKIE} from '@/sanity/lib/client'

/**
 * Classifies every request as draft or published before a route renders, so
 * pages only have to read `Astro.locals.isDraft`.
 */
export const onRequest = defineMiddleware(({cookies, locals}, next) => {
  locals.isDraft = cookies.get(DRAFT_COOKIE)?.value === '1'
  locals.syncTags = []
  return next()
})
