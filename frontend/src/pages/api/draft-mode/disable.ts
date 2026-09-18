import type {APIRoute} from 'astro'
import {DRAFT_COOKIE} from '@/sanity/lib/client'

export const prerender = false

export const GET: APIRoute = ({cookies, redirect}) => {
  cookies.delete(DRAFT_COOKIE, {path: '/'})
  cookies.delete('__prerender_bypass', {path: '/'})
  return redirect('/', 307)
}
