import type {APIRoute} from 'astro'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {getDraftClient, DRAFT_COOKIE} from '@/sanity/lib/client'

export const prerender = false

/**
 * Presentation tool entry point. Validates the one-time secret Sanity appends
 * to the preview URL, then sets the cookie middleware reads to decide whether
 * a request renders drafts.
 */
/**
 * When draft mode can't start, the preview frame stays here, so this is what
 * Presentation shows: a short page saying what went wrong and what to do.
 */
const failed = (status: number, title: string, fix: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>Preview couldn't start</title>` +
      `<body style="font:16px/1.5 system-ui,sans-serif;margin:3rem;color:#07083d">` +
      `<h1 style="font-size:1.25rem">Preview couldn't start: ${title}</h1><p>${fix}</p></body>`,
    {status, headers: {'Content-Type': 'text/html; charset=utf-8'}},
  )

export const GET: APIRoute = async ({request, cookies, redirect, url}) => {
  const token = import.meta.env.SANITY_API_READ_TOKEN
  if (!token) {
    return failed(500, 'no read token', 'Add <code>SANITY_API_READ_TOKEN</code> to <code>frontend/.env</code> and restart the dev server.')
  }

  /**
   * Only Presentation can mint the one-time secret, so in dev `?dev=1` opts in
   * without one — that is the only way to preview drafts in an ordinary tab.
   * import.meta.env.DEV is false in any build, so this cannot ship.
   */
  let redirectTo = '/'

  if (import.meta.env.DEV && url.searchParams.get('dev') === '1') {
    const to = url.searchParams.get('redirect') ?? '/'
    // Same-origin paths only; never bounce to another site.
    redirectTo = to.startsWith('/') && !to.startsWith('//') ? to : '/'
  } else {
    const result = await validatePreviewUrl(getDraftClient(token), request.url)
    if (!result.isValid) {
      return failed(401, 'the preview link has expired', 'Reload Presentation in the Studio to get a new one.')
    }
    redirectTo = result.redirectTo ?? '/'
  }

  // Presentation renders this site in an iframe on the Studio's origin. In
  // production (e.g. *.sanity.studio framing example.com) that is cross-site,
  // so the cookie must be SameSite=None, which browsers only accept with
  // Secure over https. Locally, localhost:3333 and localhost:4321 are the
  // *same* site — ports don't count — so a plain Lax cookie is sent into the
  // iframe, and marking it Secure over http would make some browsers (Safari)
  // drop it silently.
  const crossSite = url.protocol === 'https:'

  cookies.set(DRAFT_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite,
    maxAge: 60 * 60 * 24,
  })

  // Vercel serves ISR-cached HTML unless this cookie carries the bypass token;
  // without it the preview would show the last published render.
  const bypassToken = import.meta.env.SANITY_REVALIDATE_SECRET
  if (bypassToken) {
    cookies.set('__prerender_bypass', bypassToken, {
      path: '/',
      httpOnly: true,
      sameSite: crossSite ? 'none' : 'lax',
      secure: crossSite,
    })
  }

  return redirect(redirectTo, 307)
}
