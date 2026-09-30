import type {PortableTextBlock} from '@portabletext/types'
import {getClient} from './client'
import {sanityFetch} from './live'
import {SITE_INFO_QUERY} from './queries'
import {phoneText} from '@/lib/phone'
import {DEFAULT_LANGUAGE, languageOf} from '@/lib/i18n'
import {stegaClean} from '@sanity/client/stega'

export type SiteInfo = {
  phone?: string | null
  phoneText?: string | null
  phoneLabel?: string | null
  phoneTexts?: {_key: string; text?: string | null}[] | null
}

/**
 * The site's phone from Site Settings, for inline rich text (studio
 * site-info.ts) and Phone blocks, in the page's language: on a Spanish page
 * the Spanish settings' label and Main Phone Text replace the English ones
 * when filled in, as for the header and footer (lib/siteSettings.ts). Fetched
 * once per request, however many times a page uses it.
 */
export function getSiteInfo(locals: App.Locals): Promise<SiteInfo> {
  locals.siteInfo ??= sanityFetch(getClient(locals.isDraft), locals, SITE_INFO_QUERY).then((info) => {
    const english: SiteInfo = info?.en ?? {}
    if (languageOf(locals.language) === DEFAULT_LANGUAGE || !info?.es) return english
    const translated = (value?: string | null) => (value && stegaClean(value).trim() ? value : undefined)
    return {
      ...english,
      phoneText: translated(info.es.phoneText) ?? english.phoneText,
      phoneLabel: translated(info.es.phoneLabel) ?? english.phoneLabel,
    }
  })
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

/** What an inline phone shows for its saved choice (see lib/phone.ts phoneText). */
export function siteInfoText(info: SiteInfo, key: string | null | undefined): string {
  return phoneText(info, key)
}
