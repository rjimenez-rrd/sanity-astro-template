import type {APIRoute} from 'astro'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {getDraftClient, DRAFT_COOKIE} from '@/sanity/lib/client'

export const prerender = false

/**
 * Presentation tool entry point. Validates the one-time secret Sanity appends
 * to the preview URL, then sets the cookie middleware reads to decide whether
 * a request renders drafts.
 */
export const GET: APIRoute = async ({request, cookies, redirect, url}) => {
  const token = import.meta.env.SANITY_API_READ_TOKEN
  if (!token) return new Response('Missing SANITY_API_READ_TOKEN', {status: 500})

  const {isValid, redirectTo = '/'} = await validatePreviewUrl(getDraftClient(token), request.url)

  if (!isValid) return new Response('Invalid secret', {status: 401})

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
