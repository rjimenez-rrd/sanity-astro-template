import type {APIRoute} from 'astro'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

export const prerender = false

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}})

/**
 * Sanity webhook receiver — the equivalent of the Next app's revalidatePath().
 *
 * Vercel's ISR re-generates and re-caches a single path when it is requested
 * with the `x-prerender-revalidate` header carrying the adapter's bypassToken,
 * which is how per-path invalidation survives the move off Next.
 */
export const POST: APIRoute = async ({request, url}) => {
  const secret = import.meta.env.SANITY_REVALIDATE_SECRET

  if (!secret) return json({message: 'Missing SANITY_REVALIDATE_SECRET'}, 500)

  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  if (!signature) return json({message: 'Missing signature'}, 401)

  const raw = await request.text()

  if (!(await isValidSignature(raw, signature, secret))) {
    return json({message: 'Invalid signature'}, 401)
  }

  const body = JSON.parse(raw) as {_type?: string; slug?: {current?: string}}
  if (!body?._type) return json({message: 'Bad request'}, 400)

  const paths = new Set<string>()

  switch (body._type) {
    case 'homePage':
      paths.add('/')
      break
    case 'page':
      if (body.slug?.current) paths.add(`/${body.slug.current}`)
      paths.add('/') // nav/footer might reference pages
      break
    case 'blogPost':
      if (body.slug?.current) paths.add(`/blog/${body.slug.current}`)
      paths.add('/blog')
      break
    case 'siteSettings':
      // Header, footer and nav are on every page. There is no wildcard purge,
      // so refresh the fixed entry points and let the rest expire normally.
      paths.add('/')
      paths.add('/blog')
      break
    default:
      paths.add('/')
  }

  const origin = import.meta.env.PUBLIC_SITE_URL || url.origin

  const results = await Promise.all(
    [...paths].map(async (path) => {
      try {
        const res = await fetch(new URL(path, origin), {
          headers: {'x-prerender-revalidate': secret},
        })
        return {path, status: res.status, ok: res.ok}
      } catch (err) {
        return {path, ok: false, error: err instanceof Error ? err.message : 'fetch failed'}
      }
    }),
  )

  return json({revalidated: true, type: body._type, results})
}
