/**
 * What's specific to this WordPress site (thesandersfirm.com): its content
 * types, custom fields and Elementor template ids, and what each becomes
 * here. Moving another site over starts by changing this file.
 */

/** WordPress types that become News posts: the site's custom News type, and regular posts if any. */
export const NEWS_TYPES = ['news', 'post']

/** Their categories: the News type's own taxonomy, and regular post categories. */
export const NEWS_TAXONOMIES = ['news-category', 'category']

/** Pages with this Page Type (the page-type taxonomy) become Practice Areas. */
export const PRACTICE_AREA_TYPE = 'practice-area'

/** ACF fields on Practice Area pages. */
export const ACF = {
  /** The hero's intro text: plain text, a blank line between paragraphs. */
  intro: 'intro_text',
  /** The sidebar's Related Pages: a PHP-serialized list of page ids. */
  relatedPages: 'acf_related_pages',
}

/** Saved templates that are one of the site's built-in CTA Banners (frontend/src/lib/banners.ts), by id: English, Spanish. */
export const TEMPLATE_BANNERS: Record<string, string> = {'687': 'we-have-your-back', '1022': 'we-have-your-back'}

/** The "Bottom CTA" template (English, Spanish): the form section, a Form CTA block here. */
export const BOTTOM_CTA_TEMPLATES = new Set(['264', '949'])

/**
 * What each Elementor loop lists, by the id of its loop item template: the
 * export names the template, not the post type.
 */
export const LOOP_TEMPLATES: Record<string, string> = {
  '446': 'testimonials',
  '680': 'testimonials',
  '492': 'case-result',
  '1103': 'case-result',
  '945': 'case-result',
  '1506': 'case-result',
  '238': 'news',
  '674': 'news',
  '463': 'news',
  '195': 'attorneys',
  '252': 'videos',
  '177': 'related-pages',
  '932': 'search',
}

/** The WordPress types for the records that become Case Results, Lawyers and Reviews. */
export const RECORD_TYPES = {
  caseResults: 'case-result',
  attorneys: 'attorneys',
  testimonials: 'testimonials',
}

/** Their custom fields (ACF). */
export const RECORD_FIELDS = {
  caseAmount: 'case_result_amount',
  caseDescription: 'case_result_description',
  attorneyPosition: 'position',
  attorneyPhone: 'phone_number',
  attorneyEmail: 'email',
  attorneyFax: 'fax',
  /** The street address of the office they mainly work at. */
  attorneyOffice: 'primary_office',
  /** A list of links to their practice area pages. */
  attorneyPracticeAreas: 'practice_areas',
  testimonialTitle: 'testimonial_title',
  testimonialText: 'testimonial_text',
}

