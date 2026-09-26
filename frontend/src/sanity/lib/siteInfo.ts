import type {PortableTextBlock} from '@portabletext/types'
import {getClient} from './client'
import {sanityFetch} from './live'
import {SITE_INFO_QUERY} from './queries'

export type SiteInfo = {phone?: string | null}

/**
 * The Site Settings values rich text can place inline (studio site-info.ts).
 * Fetched once per request, however many times a page uses them.
 */
export function getSiteInfo(locals: App.Locals): Promise<SiteInfo> {
  locals.siteInfo ??= sanityFetch(getClient(locals.isDraft), locals, SITE_INFO_QUERY).then(
    (info) => info ?? {},
  )
  return locals.siteInfo
}

/**
 * Rich text with each inline Site Info turned into plain text, for anything
 * that reads the words rather than rendering them (e.g. toPlainText), which
 * would otherwise drop them and leave a gap mid-sentence.
 */
export function fillSiteInfo<T>(blocks: T[], info: SiteInfo): T[] {
  return blocks.map((block) => {
    const {children} = block as PortableTextBlock
    if (!Array.isArray(children)) return block
    return {
      ...block,
      children: children.map((child) =>
        child._type === 'siteInfo'
          ? {_type: 'span', _key: child._key, marks: [], text: info[(child as {key?: string}).key as keyof SiteInfo] ?? ''}
          : child,
      ),
    }
  })
}
