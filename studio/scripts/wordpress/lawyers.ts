/**
 * WordPress attorneys → Lawyers (wp-attorney-<id>): name, role, photo and
 * contact details, their practice areas and office, and their content split
 * by attorney-content.ts into the bio, the credential lists and the video.
 * Role and bio come in Spanish too; the rest is shared.
 */
import {splitAttorneyContent} from './attorney-content'
import type {WpItem} from './export-file'
import {imageField} from './images'
import {client, note, type Obj} from './options'
import {pairs, publishedAt} from './record-pairs'
import {decode, richText} from './rich-text'
import {RECORD_FIELDS as F} from './site-mappings'

/** The Lawyer's lists (English only). */
const LIST_FIELDS = ['education', 'barAdmissions', 'languages', 'speakingEvents', 'publications'] as const

/** English pages by slug, to link lawyers to the practice areas they handle. */
export type PageIdsBySlug = Map<string, number>

/** The practice area pages their Practice Areas field links to (/…/lead-poisoning/ → that page), as weak references. */
function practiceAreaRefs(html: string | undefined, pages: PageIdsBySlug): Obj[] {
  const slugs = [...(html ?? '').matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/\/+$/, '').split('/').pop() ?? '')
  const ids = [...new Set(slugs.map((s) => pages.get(s)).filter((id): id is number => Boolean(id)))]
  return ids.map((id) => ({_type: 'reference', _key: `pa-${id}`, _ref: `wp-page-${id}`, _weak: true}))
}

/**
 * An address's street: its first two words, e.g. "100 Garden City Plaza #408,
 * Garden City" → "100 garden". Enough to tell the firm's offices apart, however
 * the suite and city are written.
 */
const street = (address = '') => address.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).join(' ')

/** "Meet Martin Block" → "Martin Block". */
const attorneyName = (title: string) => decode(title).replace(/^Meet\s+/i, '').trim()

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function buildLawyers(items: WpItem[], pages: PageIdsBySlug): Promise<Obj[]> {
  // Their Office: the WordPress address matched to Site Settings' offices by street.
  const offices: Obj[] = (await client.fetch('*[_id == "siteSettings"][0].footerOffices[]{_key, name, address}')) ?? []
  const officeAt = (address: string | undefined) =>
    address ? offices.find((o) => street(o.address) === street(decode(address)))?._key : undefined

  const docs: Obj[] = []
  for (const {main, es} of pairs(items)) {
    const name = attorneyName(main.title)
    const where = `lawyer ${name}`
    console.log(`  ${where}`)
    const photo = await imageField(main.featuredImage?.url, main.featuredImage?.alt || name)
    if (!photo) note(where, 'No photo: add one before publishing (it is required).')
    const role = decode(main.fields[F.attorneyPosition] ?? '')
    if (!role) note(where, 'No position in WordPress: add a Role before publishing.')
    // Education, Bar Admission, Languages and Speaking/Events are headed
    // lists in WordPress's content, with the video and pasted-in client
    // testimonials among the biography: each goes to its own field.
    const content = splitAttorneyContent(main.content)
    const contentEs = es ? splitAttorneyContent(es.content) : undefined
    const bio = await richText(content.bio)
    const bioEs = contentEs ? await richText(contentEs.bio) : []
    const removed = content.testimonialsRemoved + (contentEs?.testimonialsRemoved ?? 0)
    if (removed) note(where, `${removed} client testimonials taken out of the bio (they belong in Reviews).`)
    // The lists in English only: Spanish pages show the same ones.
    const lists = Object.fromEntries(LIST_FIELDS.filter((field) => content[field].length).map((field) => [field, content[field]]))
    const video = content.videoUrl ?? contentEs?.videoUrl
    const practiceAreas = practiceAreaRefs(main.fields[F.attorneyPracticeAreas], pages)
    const office = officeAt(main.fields[F.attorneyOffice])
    if (main.fields[F.attorneyOffice] && !office) note(where, `Its office "${decode(main.fields[F.attorneyOffice])}" isn't in Site Settings: pick one in the Studio.`)
    docs.push({
      _id: `wp-attorney-${main.id}`,
      _type: 'lawyer',
      name,
      slug: {_type: 'slug', current: slugify(name)},
      ...(role ? {role} : {}),
      ...(es?.fields[F.attorneyPosition] ? {roleEs: decode(es.fields[F.attorneyPosition])} : {}),
      ...(photo ? {photo} : {}),
      ...(bio.length ? {bio} : {}),
      ...(bioEs.length ? {bioEs} : {}),
      ...lists,
      ...(video ? {video} : {}),
      ...(main.fields[F.attorneyEmail] ? {email: decode(main.fields[F.attorneyEmail])} : {}),
      ...(main.fields[F.attorneyPhone] ? {phone: decode(main.fields[F.attorneyPhone])} : {}),
      ...(main.fields[F.attorneyFax] ? {fax: decode(main.fields[F.attorneyFax])} : {}),
      ...(office ? {office} : {}),
      ...(practiceAreas.length ? {practiceAreas} : {}),
      ...(publishedAt(main) ? {publishedAt: publishedAt(main)} : {}),
    })
  }
  return docs
}
