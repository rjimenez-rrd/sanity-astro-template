import type {APIRoute} from 'astro'

export const prerender = false

/**
 * Mock form endpoint — replace with your own webhook/service.
 * See README for configuration instructions.
 */
export const POST: APIRoute = () =>
  new Response(JSON.stringify({success: true, message: 'Form submitted (mock)'}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  })
