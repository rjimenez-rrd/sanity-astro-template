import type {APIRoute} from 'astro'
import {getDraftClient} from '@/sanity/lib/client'

export const prerender = false

/**
 * Dev-only change feed for a draft tab opened outside Presentation.
 *
 * Sanity's real-time listener needs the read token, which must stay on the
 * server, so the server subscribes and forwards a bare "changed" ping over SSE.
 * The browser then re-checks the page — no token leaves this process, and
 * nothing is sent until a document actually saves.
 */
export const GET: APIRoute = () => {
  if (!import.meta.env.DEV) return new Response('Not found', {status: 404})

  const token = import.meta.env.SANITY_API_READ_TOKEN
  if (!token) return new Response('Missing SANITY_API_READ_TOKEN', {status: 500})

  let subscription: {unsubscribe: () => void} | undefined

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // Client went away between the event and this write.
        }
      }

      send('ready')

      subscription = getDraftClient(token)
        // Drafts included: that is the whole point of previewing them.
        .listen('*', {}, {includeResult: false, visibility: 'query'})
        .subscribe({
          next: () => send('changed'),
          error: () => {
            try {
              controller.close()
            } catch {
              // Already closed.
            }
          },
        })
    },
    cancel() {
      subscription?.unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
}
