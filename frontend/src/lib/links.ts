import {stegaClean} from '@sanity/client/stega'
import {localizedPath} from '@/lib/i18n'

interface LinkInternal {
  _type: 'linkInternal'
  reference?: {slug?: {current?: string}; language?: string | null} | null
}

interface LinkExternal {
  _type: 'linkExternal'
  url?: string
  newWindow?: boolean
}

interface PageSlugLink {
  _type: 'pageSlug'
  slug?: string
}

interface SitePageLink {
  _type: 'linkSitePage'
  page?: string
}

export type LinkItem = LinkInternal | LinkExternal | PageSlugLink | SitePageLink

/** Paths of the pages built into the site, keyed as the Studio's Site Page list stores them. */
const SITE_PAGE_PATHS: Record<string, string> = {
  practiceAreas: '/practice-areas',
  news: '/news',
  search: '/search',
}


/**
 * Resolves the Studio's polymorphic link array into an href.
 * Shared by callToAction, buttonGroup and pricingCard.
 *
 * `missing` is true when the link goes nowhere: no link at all, or one whose
 * page, URL or slug was never filled in. The href is then '#', and the preview
 * flags the button so an editor notices before publishing.
 */
export function resolveHref(linkItems: LinkItem[]): {
  href: string
  isExternal: boolean
  missing: boolean
} {
  const none = {href: '#', isExternal: false, missing: true}
  const item = linkItems[0]
  if (!item) return none

  switch (stegaClean(item._type)) {
    case 'linkExternal': {
      const ext = item as LinkExternal
      return ext.url ? {href: ext.url, isExternal: Boolean(ext.newWindow), missing: false} : none
    }
    case 'linkInternal': {
      const reference = (item as LinkInternal).reference
      const slug = reference?.slug?.current
      // A Spanish page links to /es/<slug>.
      return slug
        ? {href: localizedPath(slug, reference?.language), isExternal: false, missing: false}
        : none
    }
    case 'pageSlug': {
      // Editors type it either way ("about" or "/about"), per the field's hint.
      const slug = ((item as PageSlugLink).slug || '').replace(/^\/+/, '')
      return slug ? {href: `/${slug}`, isExternal: false, missing: false} : none
    }
    case 'linkSitePage': {
      const page = stegaClean((item as SitePageLink).page)
      const path = page && SITE_PAGE_PATHS[page]
      return path ? {href: path, isExternal: false, missing: false} : none
    }
    default:
      return none
  }
}
