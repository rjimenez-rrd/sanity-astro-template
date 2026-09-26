import type {PortableTextBlock} from '@portabletext/types'
import {getClient} from './client'
import {sanityFetch} from './live'
import {SITE_INFO_QUERY} from './queries'
import {phoneText} from '@/lib/phone'

export type SiteInfo = {phone?: string | null; phoneText?: string | null; phoneLabel?: string | null}

/**
 * The site's phone from Site Settings, for inline rich text (studio
 * site-info.ts) and Phone blocks. Fetched once per request, however many
 * times a page uses it.
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
          ? {_type: 'span', _key: child._key, marks: [], text: siteInfoText(info, (child as {key?: string}).key)}
          : child,
      ),
    }
  })
}

/** What an inline Site Info shows for its key: 'phone' reads as displayed, 'phoneNumber' as the number. */
export function siteInfoText(info: SiteInfo, key: string | null | undefined): string {
  if (key === 'phone') return phoneText(info, 'display')
  if (key === 'phoneNumber') return phoneText(info, 'number')
  return ''
}
