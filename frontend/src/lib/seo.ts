import {stegaClean} from '@sanity/client/stega'

interface SeoSource {
  metaTitle?: string | null
  metaDescription?: string | null
  noIndex?: boolean | null
  ogImage?: {asset?: {url?: string | null} | null} | null
}

/**
 * Collapses a document's seo object plus fallbacks into Base.astro's props,
 * so every route builds its meta tags the same way.
 */
export function buildSeo(
  seo: SeoSource | null | undefined,
  fallbacks: {title?: string | null; description?: string | null} = {},
) {
  return {
    title: stegaClean(seo?.metaTitle) || stegaClean(fallbacks.title) || undefined,
    description:
      stegaClean(seo?.metaDescription) || stegaClean(fallbacks.description) || undefined,
    noIndex: Boolean(seo?.noIndex),
    ogImage: seo?.ogImage?.asset?.url ? stegaClean(seo.ogImage.asset.url) : undefined,
  }
}
