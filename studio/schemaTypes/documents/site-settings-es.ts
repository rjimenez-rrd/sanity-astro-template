import {defineType, type FieldDefinition} from 'sanity'
import {TranslateIcon} from '@sanity/icons'
import {siteSettingsType} from './site-settings'

/**
 * The Site Settings fields whose words change with the language. Everything
 * else — logo, theme, the phone number itself, social links, search on/off —
 * is shared and stays in Site Settings.
 */
const TRANSLATED_FIELDS = [
  'tagline',
  'footerPhoneLabel',
  'footerPhoneText',
  'mainNav',
  'searchHeading',
  'searchPlaceholder',
  'headerExtraLink',
  'footerNav',
  'footerOffices',
  'footerDisclaimerTitle',
  'footerDisclaimer',
  'footerCopyright',
  'footerLegalLinks',
]

/** Per field, where the Spanish version needs saying something different. */
const DESCRIPTIONS: Record<string, string> = {
  headerExtraLink:
    'Shown on Spanish pages, e.g. English → /. It goes to the English version of the page when there is one; this link is the fallback.',
  mainNav:
    'Links to English pages switch to their Spanish version automatically, so /about-us can stay as it is.',
  footerNav: 'Links to English pages switch to their Spanish version automatically.',
  footerLegalLinks: 'Links to English pages switch to their Spanish version automatically.',
}

/**
 * The same fields as Site Settings, minus English starting values and
 * required rules: anything left empty here falls back to the English one, so
 * the site never shows a blank while this is being translated.
 */
const fields = (siteSettingsType.fields as FieldDefinition[])
  .filter((field) => TRANSLATED_FIELDS.includes(field.name))
  .map((field) => ({
    ...field,
    initialValue: undefined,
    validation: undefined,
    description: DESCRIPTIONS[field.name] ?? field.description,
  })) as FieldDefinition[]

/**
 * Spanish words for the header, menus and footer on /es/ pages. A singleton:
 * see structure.ts. Its id, siteSettingsEs, is what the frontend reads.
 */
export const siteSettingsEsType = defineType({
  name: 'siteSettingsEs',
  title: 'Site Settings (Español)',
  type: 'document',
  icon: TranslateIcon,
  groups: [
    {name: 'branding', title: 'Phone & Tagline'},
    {name: 'navigation', title: 'Navigation', default: true},
    {name: 'footer', title: 'Footer'},
  ],
  fields,
  preview: {
    prepare() {
      return {title: 'Site Settings (Español)', media: TranslateIcon}
    },
  },
})
