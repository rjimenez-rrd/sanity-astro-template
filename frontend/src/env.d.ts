/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string
  readonly PUBLIC_SANITY_DATASET: string
  readonly PUBLIC_SANITY_STUDIO_URL?: string
  readonly PUBLIC_SITE_URL?: string
  readonly SANITY_API_READ_TOKEN?: string
  readonly SANITY_REVALIDATE_SECRET?: string
  readonly VERCEL_DEPLOY_HOOK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts from the draft-mode cookie. */
    isDraft: boolean
    /** Live Content API tags for every query this request ran. */
    syncTags: string[]
  }
}
