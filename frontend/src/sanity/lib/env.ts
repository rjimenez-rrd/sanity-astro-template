// Astro exposes only PUBLIC_*-prefixed vars to the client bundle, so the
// project coordinates keep that prefix. The tokens below stay server-only.
export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string
export const dataset = import.meta.env.PUBLIC_SANITY_DATASET as string
export const apiVersion = '2025-03-20'
export const studioUrl =
  (import.meta.env.PUBLIC_SANITY_STUDIO_URL as string) || 'http://localhost:3333'
