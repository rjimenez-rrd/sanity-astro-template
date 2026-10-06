/**
 * An attorney's WordPress content, split into the parts a Lawyer keeps
 * separately. The content is written as headed lists, then the biography:
 *
 *   Education            <ul>…</ul>      → education
 *   Bar Admission        <ul>…</ul>      → barAdmissions
 *   Languages            <ul>…</ul>      → languages
 *   Speaking/Events      <ul>…</ul>      → speakingEvents
 *   Publications:        <ul>…</ul>      → publications
 *   Hear From Our Clients  a quote  <strong>Name</strong>   (dropped: client testimonials)
 *   https://youtu.be/…                   → videoUrl
 *   …paragraphs…                         → bio (HTML)
 *
 * with Spanish headings on the Spanish pages ("Educación", "Idiomas", …).
 */

export interface AttorneyContent {
  education: string[]
  barAdmissions: string[]
  languages: string[]
  speakingEvents: string[]
  publications: string[]
  videoUrl?: string
  /** The biography alone, as HTML. */
  bio: string
  /** How many client testimonials were taken out of it. */
  testimonialsRemoved: number
}

type ListField = 'education' | 'barAdmissions' | 'languages' | 'speakingEvents' | 'publications'

/** "Educación:" → "educacion": lower case, no accents or trailing colon. */
const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[:\s]+$/, '').replace(/\s+/g, ' ').trim()

/** Section headings, English and Spanish, as they appear on the site. */
const HEADINGS: Record<string, ListField> = {
  education: 'education',
  educacion: 'education',
  'formacion academica': 'education',
  'bar admission': 'barAdmissions',
  'bar admissions': 'barAdmissions',
  'admision al ejercicio profesional': 'barAdmissions',
  'licencias para ejercer la abogacia': 'barAdmissions',
  languages: 'languages',
  idiomas: 'languages',
  'speaking/events': 'speakingEvents',
  'speaking / events': 'speakingEvents',
  'conferencias y participacion en eventos': 'speakingEvents',
  'conferencias y eventos': 'speakingEvents',
  publications: 'publications',
  publicaciones: 'publications',
}

/** The label above each client testimonial, English and Spanish. */
const TESTIMONIAL_LABEL = /(?:Hear From Our Clients|Lo Que Dicen Nuestros Clientes|Testimonios de nuestros clientes)/i.source

const YOUTUBE = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)[^\s"<\]]*/i

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim()

export function splitAttorneyContent(html: string): AttorneyContent {
  const out: AttorneyContent = {
    education: [],
    barAdmissions: [],
    languages: [],
    speakingEvents: [],
    publications: [],
    bio: '',
    testimonialsRemoved: 0,
  }
  let rest = html

  // Headed lists: a short heading line (plain or in a <p>), then a <ul>.
  rest = rest.replace(/(?:<p[^>]*>)?\s*([^<>\n]{2,80}?)\s*(?:<\/p>)?\s*<ul[^>]*>([\s\S]*?)<\/ul>/g, (whole, heading: string, list: string) => {
    const field = HEADINGS[normalize(textOf(heading))]
    if (!field) return whole
    out[field].push(...[...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1])).filter(Boolean))
    return '\n\n'
  })

  // Client testimonials: the label, one paragraph of quote, then the client's name in bold.
  const testimonial = new RegExp(
    `(?:<p[^>]*>)?\\s*${TESTIMONIAL_LABEL}\\s*(?:</p>)?\\s*(?:<p[^>]*>)?[^\\n<]*(?:</p>)?\\s*(?:<p[^>]*>)?\\s*<strong>[^<]{1,40}</strong>\\s*(?:</p>)?`,
    'gi',
  )
  rest = rest.replace(testimonial, () => {
    out.testimonialsRemoved++
    return '\n\n'
  })
  // A label left on its own (no quote after it), and section headings with no list.
  rest = rest.replace(new RegExp(`(?:<p[^>]*>)?\\s*${TESTIMONIAL_LABEL}\\s*(?:</p>)?`, 'gi'), '\n\n')
  rest = rest.replace(/(?:<p[^>]*>)?\s*([^<>\n]{2,80}?)\s*(?:<\/p>)?(?=\s*\n|\s*<p)/g, (whole, line: string) =>
    HEADINGS[normalize(textOf(line))] ? '\n\n' : whole,
  )

  // The video: the first YouTube address, as a link, an embed or a bare line.
  out.videoUrl = rest.match(YOUTUBE)?.[0]
  rest = rest
    .replace(/<iframe[^>]*youtu[^>]*>[\s\S]*?<\/iframe>/gi, '\n\n')
    .replace(/\[embed\][^[]*\[\/embed\]/gi, '\n\n')
    .replace(new RegExp(`(?:<p[^>]*>)?\\s*${YOUTUBE.source}\\s*(?:</p>)?`, 'gi'), '\n\n')
    // Blank lines WordPress keeps as &nbsp;.
    .replace(/^\s*(?:<p[^>]*>)?\s*&nbsp;\s*(?:<\/p>)?\s*$/gim, '')

  // What's left is the biography. WordPress stores it with blank lines
  // between paragraphs rather than <p> tags (it adds them when showing it).
  const paragraphs = rest
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => textOf(p))
  out.bio = paragraphs.map((p) => (/^<(p|ul|ol|h[1-6]|blockquote)[\s>]/i.test(p) ? p : `<p>${p}</p>`)).join('\n')
  return out
}
