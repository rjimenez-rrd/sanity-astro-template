import type {APIRoute} from 'astro'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {getClient} from '@/sanity/lib/client'
import {listPageHref} from '@/lib/pagination'
import {homePath, localizedPath} from '@/lib/i18n'

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

  // language: add it to the webhook's projection ({_type, slug, language}) so
  // Spanish pages clear /es/<slug>; without it, pages count as English.
  const body = JSON.parse(raw) as {_type?: string; slug?: {current?: string}; language?: string}
  if (!body?._type) return json({message: 'Bad request'}, 400)

  const paths = new Set<string>()

  /**
   * A paginated card list also lives at <base>/page/2, /3, …, each cached on
   * its own, and adding or removing a practice area shifts every page. The
   * page size is per block, so the page count isn't known here — but it can't
   * exceed one page per practice area, so refresh up to that. A page past the
   * real end just re-renders its 404.
   */
  const addListPages = async (base: string) => {
    const total = await getClient(false)
      .fetch<number>('count(*[_type == "practiceArea" && defined(slug.current)])')
      .catch(() => 0)
    for (let n = 2; n <= total; n++) paths.add(listPageHref(base, n))
  }

  switch (body._type) {
    case 'homePage':
      // homePage-es (Spanish) is /es.
      paths.add(homePath(body.language))
      break
    case 'page':
      if (body.slug?.current) {
        const path = localizedPath(body.slug.current, body.language)
        paths.add(path)
        // Any page can hold a paginated grid; its later pages change with it.
        await addListPages(path)
      }
      paths.add('/') // nav/footer might reference pages
      break
    case 'practiceArea':
      if (body.slug?.current) paths.add(localizedPath(body.slug.current, body.language))
      paths.add('/practice-areas')
      await addListPages('/practice-areas')
      break
    case 'siteSettings':
      // Header, footer and nav are on every page. There is no wildcard purge,
      // so refresh the fixed entry points and let the rest expire normally.
      paths.add('/')
      paths.add('/practice-areas')
      await addListPages('/practice-areas')
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
