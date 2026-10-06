/**
 * What the Case Results, Lawyers and Reviews files share. Unlike pages, each
 * of these is one Sanity document holding both languages (summary and
 * summaryEs, role and roleEs, ...), so a WordPress post and its Spanish
 * translation become one document: the English one fills the main fields,
 * the Spanish one the Es fields.
 */
import type {WpItem} from './export-file'
import {DEFAULT_LANGUAGE} from './options'
import {decode} from './rich-text'

/** A record and its Spanish version, if any. */
export interface Pair {
  main: WpItem
  es?: WpItem
}

/** Pairs each record with its Spanish translation; one with no English version stands alone. */
export function pairs(items: WpItem[]): Pair[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const used = new Set<number>()
  const out: Pair[] = []
  // English first, so a pair is named after its English post.
  const ordered = [...items.filter((i) => i.language === DEFAULT_LANGUAGE), ...items.filter((i) => i.language !== DEFAULT_LANGUAGE)]
  for (const item of ordered) {
    if (used.has(item.id)) continue
    used.add(item.id)
    const esId = item.language === DEFAULT_LANGUAGE ? item.translations.es : undefined
    const es = esId && !used.has(esId) ? byId.get(esId) : undefined
    if (es) used.add(es.id)
    out.push({main: item, es})
  }
  return out
}

/** Plain text from a field that may hold HTML, keeping its line breaks. */
export const plainText = (html = '') => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*/gi, '\n\n')).replace(/\n{3,}/g, '\n\n').trim()

export const publishedAt = (item: WpItem) => (item.dateGmt ? `${item.dateGmt}Z` : item.date || undefined)
