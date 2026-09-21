import type {APIRoute} from 'astro'
import {execFile} from 'node:child_process'

export const prerender = false

/**
 * Dev-only: opens a page of this site in Google Chrome with draft mode on.
 *
 * A web page can't pick which browser a link opens in, so the Studio's
 * "Open in Chrome" action asks this local dev server to launch Chrome instead.
 * The target is always this site's own draft-mode URL — the caller only picks
 * the path — and the route doesn't exist in production builds.
 */
export const GET: APIRoute = ({url}) => {
  if (!import.meta.env.DEV) return new Response(null, {status: 404})

  const path = url.searchParams.get('path') ?? '/'
  // Same-origin paths only; never let this open some other site.
  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid path', {status: 400})
  }

  const target = `${url.origin}/api/draft-mode/enable?dev=1&redirect=${encodeURIComponent(path)}`

  // Arguments go straight to the program (no shell), so the URL can't inject commands.
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', ['-a', 'Google Chrome', target]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', 'chrome', target]]
        : ['google-chrome', [target]]

  execFile(command, args, (error) => {
    if (error) console.warn(`[open-in-chrome] Could not launch Chrome: ${error.message}`)
  })

  return new Response(null, {
    status: 204,
    // The Studio runs on another port; let it see the result.
    headers: {'Access-Control-Allow-Origin': '*'},
  })
}
