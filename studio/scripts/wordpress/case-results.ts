/**
 * WordPress case results → Case Results (wp-case-<id>): the amount, a short
 * summary from the title, Settlement / Verdict / Award, and the case story as
 * the Description, each in English and Spanish.
 */
import type {WpItem} from './export-file'
import type {Obj} from './options'
import {pairs, plainText, publishedAt} from './record-pairs'
import {decode} from './rich-text'
import {RECORD_FIELDS as F} from './site-mappings'

/** "Department Store Slip and Fall Awarded: $2,250,000" → "Department Store Slip and Fall". */
const caseSummary = (title: string) => decode(title).replace(/\s*Awarded:\s*\$[\d,.]+\s*$/i, '').trim()

/** Settlement, Verdict or Award, by the words in its title. */
function resultType(title: string) {
  if (/settle/i.test(title)) return 'Settlement'
  if (/verdict/i.test(title)) return 'Verdict'
  if (/award/i.test(title)) return 'Award'
  return undefined
}

/** "2.25M" → "$2.25M". */
const amount = (value = '') => (value.trim().startsWith('$') ? value.trim() : `$${value.trim()}`)

export function buildCaseResults(items: WpItem[]): Obj[] {
  return pairs(items).map(({main, es}) => ({
    _id: `wp-case-${main.id}`,
    _type: 'caseResult',
    amount: amount(main.fields[F.caseAmount]),
    summary: caseSummary(main.title),
    ...(es ? {summaryEs: decode(es.title)} : {}),
    ...(resultType(main.title) ? {resultType: resultType(main.title)} : {}),
    ...(main.fields[F.caseDescription] ? {description: plainText(main.fields[F.caseDescription])} : {}),
    ...(es?.fields[F.caseDescription] ? {descriptionEs: plainText(es.fields[F.caseDescription])} : {}),
    ...(publishedAt(main) ? {publishedAt: publishedAt(main)} : {}),
  }))
}
