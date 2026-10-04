// @ts-check
import {defineConfig} from 'astro/config'
import {loadEnv} from 'vite'
import sanity from '@sanity/astro'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import {DEV_PAGES} from './src/dev/routes.mjs'

const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_STUDIO_URL,
  PUBLIC_SITE_URL,
  SANITY_REVALIDATE_SECRET,
} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')

/**
 * Pages for working on the site, not for visitors: the /dev index, the
 * codebase map and the block design previews (src/dev/routes.mjs). Added only
 * under `astro dev`, so a production build has no such route and no such
 * code. They live in src/dev/, outside src/pages/, which every build includes.
 *
 * @type {import('astro').AstroIntegration}
 */
const devRoutes = {
  name: 'dev-routes',
  hooks: {
    'astro:config:setup': ({command, injectRoute}) => {
      if (command !== 'dev') return
      injectRoute({pattern: '/dev', entrypoint: './src/dev/index.astro'})
      for (const {pattern, file} of DEV_PAGES) injectRoute({pattern, entrypoint: `./src/dev/${file}`})
    },
  },
}

export default defineConfig({
  site: PUBLIC_SITE_URL || 'http://localhost:4321',

  // Content routes are server-rendered and cached by Vercel's ISR, which is
  // the direct equivalent of the Next app's `export const revalidate = 86400`.
  // They cannot be fully static: draft mode has to render per request.
  adapter: vercel({
    isr: {
      expiration: 86400,
      // Presence in the __prerender_bypass cookie serves a fresh, uncached
      // response (draft mode); presence in the x-prerender-revalidate header
      // re-generates and re-caches one path (on-demand invalidation).
      bypassToken: SANITY_REVALIDATE_SECRET || undefined,
      // API routes must never be cached: they are POST handlers and redirects
      // whose whole job is to run per request.
      exclude: ['/api/form-submit', '/api/revalidate', '/api/draft-mode/enable', '/api/draft-mode/disable'],
    },
  }),

  integrations: [
    devRoutes,
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      apiVersion: '2025-03-20',
      // The CDN caches for up to a minute, so in dev a publish would not show
      // up on refresh. Production keeps it: stale reads there are covered by
      // the ISR bypass token and the on-demand revalidate webhook.
      useCdn: process.env.NODE_ENV === 'production',
      // Stega encodes Studio edit links into returned strings. It is off for
      // published output — the invisible characters are pure bloat there — and
      // switched on per request by getClient() when rendering drafts.
      stega: {
        enabled: false,
        studioUrl: PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
