import {stegaClean} from '@sanity/client/stega'

interface LinkInternal {
  _type: 'linkInternal'
  reference?: {slug?: {current?: string}} | null
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

export type LinkItem = LinkInternal | LinkExternal | PageSlugLink


/**
 * Resolves the Studio's polymorphic link array into an href.
 * Shared by callToAction and buttonGroup, which had identical copies.
 */
export function resolveHref(linkItems: LinkItem[]): {href: string; isExternal: boolean} {
  const item = linkItems[0]
  if (!item) return {href: '#', isExternal: false}

  switch (stegaClean(item._type)) {
    case 'linkExternal': {
      const ext = item as LinkExternal
      return {href: ext.url || '#', isExternal: Boolean(ext.newWindow)}
    }
    case 'linkInternal': {
      const int = item as LinkInternal
      return {href: `/${int.reference?.slug?.current || ''}`, isExternal: false}
    }
    case 'pageSlug': {
      const slug = item as PageSlugLink
      // Editors type it either way ("about" or "/about"), per the field's hint.
      return {href: `/${(slug.slug || '').replace(/^\/+/, '')}`, isExternal: false}
    }
    default:
      return {href: '#', isExternal: false}
  }
}
