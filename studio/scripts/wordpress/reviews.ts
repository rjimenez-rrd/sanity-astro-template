/**
 * WordPress testimonials → Reviews (wp-testimonial-<id>): the client's name,
 * a title and the review, in English and Spanish. WordPress keeps no star
 * rating, so every one gets 5.
 */
import type {WpItem} from './export-file'
import {note, type Obj} from './options'
import {pairs, plainText, publishedAt} from './record-pairs'
import {decode} from './rich-text'
import {RECORD_FIELDS as F} from './site-mappings'

/** Each testimonial's id, and its Spanish version's, to the Review both become. */
export function reviewIds(items: WpItem[]): Map<string, string> {
  const ids = new Map<string, string>()
  for (const {main, es} of pairs(items)) {
    ids.set(String(main.id), `wp-testimonial-${main.id}`)
    if (es) ids.set(String(es.id), `wp-testimonial-${main.id}`)
  }
  return ids
}

export function buildReviews(items: WpItem[]): Obj[] {
  return pairs(items).map(({main, es}) => {
    const reviewText = plainText(main.fields[F.testimonialText])
    if (!reviewText) note(`review ${decode(main.title)}`, 'No review text: add it before publishing (it is required).')
    return {
      _id: `wp-testimonial-${main.id}`,
      _type: 'review',
      clientName: decode(main.title),
      ...(main.fields[F.testimonialTitle] ? {title: decode(main.fields[F.testimonialTitle])} : {}),
      ...(reviewText ? {reviewText} : {}),
      ...(es?.fields[F.testimonialTitle] ? {titleEs: decode(es.fields[F.testimonialTitle])} : {}),
      ...(es?.fields[F.testimonialText] ? {reviewTextEs: plainText(es.fields[F.testimonialText])} : {}),
      // WordPress keeps no star rating and Sanity requires one: 5, to change in the Studio where needed.
      rating: 5,
      ...(publishedAt(main) ? {publishedAt: publishedAt(main)} : {}),
    }
  })
}
