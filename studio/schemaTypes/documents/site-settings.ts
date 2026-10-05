import {defineType, defineField, defineArrayMember} from 'sanity'
import {CogIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'
import {LogoInput} from '../../components/inputs/LogoInput'

/**
 * Whether the logo's Studio preview has a white background. Set by the switch
 * in LogoInput, which is its only control, so it's hidden from the form.
 * Unset means on.
 */
const logoWhiteBackgroundField = defineField({
  name: 'whiteBackground',
  title: 'White Background in Preview',
  type: 'boolean',
  hidden: true,
})

/**
 * Where a menu link goes: a Page picked from the list, or a typed Custom Link.
 * A picked page's address is built on the site (lib/siteSettings.ts), so it
 * follows the page if its slug or Parent Page changes, and a Spanish page
 * gets its /es/ address. The list shows pages in the settings' own language:
 * English here, Spanish in Site Settings (Español), which reuses these fields.
 */
function linkTarget({required}: {required: boolean}) {
  return [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}, {type: 'practiceArea'}, {type: 'homePage'}],
      description: 'Pick a page. Its address is filled in for you.',
      options: {
        filter: ({document}) => ({
          filter: 'coalesce(language, "en") == $language',
          params: {language: document._type === 'siteSettingsEs' ? 'es' : 'en'},
        }),
      },
    }),
    defineField({
      name: 'href',
      title: 'Custom Link',
      type: 'string',
      description:
        'Or a path (e.g. /contact-us) or a full URL, for anything that isn’t a page above. Used only when no Page is picked.',
      validation: (rule) =>
        rule.custom((value: string | undefined, {parent}) => {
          if (value && !/^(\/|https?:\/\/|mailto:|tel:|#)/.test(value.trim())) {
            return 'Start a path with / (e.g. /contact-us), or use a full URL.'
          }
          if (required && !value && !(parent as {page?: unknown})?.page)
            return 'Pick a Page or add a Custom Link.'
          return true
        }),
    }),
  ]
}

/** A menu link's subtitle in the list: the picked page's slug, or the Custom Link. */
const targetPreview = {pageSlug: 'page.slug.current', pageType: 'page._type', href: 'href'}
const targetSubtitle = (t: {pageSlug?: string; pageType?: string; href?: string}) =>
  t.pageType === 'homePage' ? 'Home Page' : t.pageSlug ? `Page: ${t.pageSlug}` : t.href || ''

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'branding', title: 'Branding', default: true},
    {name: 'theme', title: 'Theme'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'footer', title: 'Footer'},
    {name: 'practiceAreas', title: 'Practice Areas'},
  ],
  fields: [
    // --- Branding ---
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      group: 'branding',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'branding',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: {hotspot: true},
      components: {input: LogoInput},
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
        logoWhiteBackgroundField,
      ],
    }),
    // The phone shown across the site: header, footer, Phone blocks and the
    // inline phone in rich text all read these three. The footer* names are
    // from when only the footer used them; kept so no data has to move.
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      group: 'branding',
      description: 'The number that gets dialed, e.g. 5165913208.',
    }),
    defineField({
      name: 'footerPhoneText',
      title: 'Main Phone Text',
      type: 'string',
      group: 'branding',
      description:
        "How the number reads, e.g. (833) SANDERS. The header and footer use this one, and it's the default everywhere else. It still dials the Phone Number. Leave empty to show that number, formatted.",
    }),
    defineField({
      name: 'phoneTexts',
      title: 'More Phone Texts',
      type: 'array',
      group: 'branding',
      description:
        'Other ways to word the phone, e.g. "Call (833) Sanders". Phone blocks and inline phones can pick any of them. All dial the Phone Number.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'phoneText',
          title: 'Phone Text',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Only for the Studio, to pick it by, e.g. "Call to action".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'string',
              description: 'What the site shows, e.g. Call (833) Sanders.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'text', subtitle: 'name'}},
        }),
      ],
    }),
    defineField({
      name: 'footerPhoneLabel',
      title: 'Phone Label',
      type: 'string',
      group: 'branding',
      description: 'The small line above the phone, e.g. Free Consultation 24/7.',
      initialValue: 'Free Consultation 24/7',
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'object',
      group: 'theme',
      description:
        'Site-wide colors and fonts. Every block, button and heading reads these, and they show up as swatches in the color pickers.',
      options: {collapsible: false},
      fields: [
        defineField({
          name: 'primary',
          title: 'Primary',
          type: 'string',
          description: 'Buttons, links and accents.',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'secondary',
          title: 'Secondary',
          type: 'string',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'accent',
          title: 'Accent',
          type: 'string',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'foreground',
          title: 'Text',
          type: 'string',
          description: 'Body text, headings included.',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'background',
          title: 'Background',
          type: 'string',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'muted',
          title: 'Muted Text',
          type: 'string',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'border',
          title: 'Border',
          type: 'string',
          components: {input: ColorStringInput},
        }),
        defineField({
          name: 'headingFont',
          title: 'Heading Font',
          type: 'string',
          description:
            'Any Google Font, spelled as Google does, e.g. Playfair Display. Leave empty to keep Montserrat.',
        }),
        defineField({
          name: 'bodyFont',
          title: 'Body Font',
          type: 'string',
          description: 'Any Google Font, e.g. Source Sans 3. Leave empty to keep Inter.',
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      group: 'branding',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'Twitter / X', value: 'twitter'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'GitHub', value: 'github'},
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {platform: 'platform', url: 'url'},
            prepare({platform, url}: {platform?: string; url?: string}) {
              return {title: platform || 'Social Link', subtitle: url}
            },
          },
        }),
      ],
    }),

    // --- Navigation ---
    defineField({
      name: 'mainNav',
      title: 'Main Navigation',
      type: 'array',
      group: 'navigation',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navLink',
          title: 'Link',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            ...linkTarget({required: true}),
            defineField({
              name: 'isButton',
              title: 'Display as Button',
              type: 'boolean',
              description: 'Renders as a CTA button instead of a plain link.',
              initialValue: false,
            }),
          ],
          preview: {
            select: {label: 'label', isButton: 'isButton', ...targetPreview},
            prepare({
              label,
              isButton,
              ...target
            }: {
              label?: string
              isButton?: boolean
              pageSlug?: string
              pageType?: string
              href?: string
            }) {
              return {
                title: label || 'Link',
                subtitle: `${targetSubtitle(target)}${isButton ? ' (CTA)' : ''}`,
              }
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'navDropdown',
          title: 'Dropdown',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            // Optional: clicking the label opens this page; hovering still shows
            // the dropdown. Neither set: the label only opens the dropdown.
            ...linkTarget({required: false}),
            defineField({
              name: 'items',
              title: 'Dropdown Items',
              type: 'array',
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'dropdownItem',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
                    ...linkTarget({required: true}),
                    defineField({
                      name: 'description',
                      title: 'Description',
                      type: 'string',
                    }),
                    defineField({
                      name: 'icon',
                      title: 'Icon',
                      type: 'image',
                    }),
                  ],
                  preview: {
                    select: {label: 'label', ...targetPreview},
                    prepare({
                      label,
                      ...target
                    }: {
                      label?: string
                      pageSlug?: string
                      pageType?: string
                      href?: string
                    }) {
                      return {title: label || 'Item', subtitle: targetSubtitle(target)}
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {label: 'label', items: 'items'},
            prepare({label, items}: {label?: string; items?: Array<unknown>}) {
              return {
                title: `▾ ${label || 'Dropdown'}`,
                subtitle: `${items?.length ?? 0} items`,
              }
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'headerSearch',
      title: 'Show Search',
      type: 'boolean',
      group: 'navigation',
      description:
        'The round search button after the menu. It opens a full-screen search over pages, practice areas and news.',
      initialValue: true,
    }),
    defineField({
      name: 'searchHeading',
      title: 'Search Heading',
      type: 'string',
      group: 'navigation',
      initialValue: 'Looking for something?',
      hidden: ({parent}) => parent?.headerSearch === false,
    }),
    defineField({
      name: 'searchPlaceholder',
      title: 'Search Placeholder',
      type: 'string',
      group: 'navigation',
      initialValue: 'Search articles and pages...',
      hidden: ({parent}) => parent?.headerSearch === false,
    }),
    defineField({
      name: 'headerExtraLink',
      title: 'Extra Link',
      type: 'footerLink',
      group: 'navigation',
      description: 'A small link at the far right, e.g. Spanish → /es.',
    }),

    // --- Footer ---
    defineField({
      name: 'footerLogo',
      title: 'Footer Logo',
      type: 'image',
      group: 'footer',
      description:
        'A light version for the dark footer. Leave empty to use the main logo in white.',
      components: {input: LogoInput},
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
        logoWhiteBackgroundField,
      ],
    }),
    defineField({
      name: 'footerNav',
      title: 'Footer Menu',
      type: 'array',
      group: 'footer',
      description: 'The row of links between the two lines.',
      of: [defineArrayMember({type: 'footerLink'})],
    }),
    defineField({
      name: 'footerOffices',
      title: 'Offices',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerOffice',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'address',
              title: 'Address',
              type: 'text',
              rows: 2,
              description: 'Line breaks are kept.',
            }),
            defineField({
              name: 'directionsUrl',
              title: 'Directions Link',
              type: 'url',
              description: 'Leave empty to open the address in Google Maps.',
            }),
          ],
          preview: {
            select: {title: 'name', subtitle: 'address'},
          },
        }),
      ],
    }),
    defineField({
      name: 'footerDisclaimerTitle',
      title: 'Disclaimer Title',
      type: 'string',
      group: 'footer',
      description: 'Shown in bold before the disclaimer.',
      initialValue: 'Attorney Advertising',
    }),
    defineField({
      name: 'footerDisclaimer',
      title: 'Disclaimer',
      type: 'string',
      group: 'footer',
      initialValue: 'Prior results do not guarantee a similar outcome.',
    }),
    defineField({
      name: 'footerCopyright',
      title: 'Copyright',
      type: 'string',
      group: 'footer',
      description: 'Leave empty for "<Site Name> © All Rights Reserved".',
    }),
    defineField({
      name: 'footerLegalLinks',
      title: 'Legal Links',
      type: 'array',
      group: 'footer',
      description: 'Bottom right, e.g. Privacy Policy, FAQ, Terms and Conditions.',
      of: [defineArrayMember({type: 'footerLink'})],
    }),

    // --- Practice Areas ---
    // Defaults for every Practice Area page that leaves its own empty. Shared
    // by both languages: a lawyer's name doesn't change, and the form shows
    // its Spanish translation on Spanish pages.
    defineField({
      name: 'defaultReviewer',
      title: 'Default Content Reviewer',
      type: 'reference',
      group: 'practiceAreas',
      to: [{type: 'lawyer'}],
      description:
        'Shown as "Content Reviewed by" on every Practice Area page that doesn’t pick its own.',
    }),
    defineField({
      name: 'defaultBottomForm',
      title: 'Default Bottom Form',
      type: 'reference',
      group: 'practiceAreas',
      to: [{type: 'ctaForm'}],
      description:
        'The form at the bottom of every Practice Area page that doesn’t pick its own. Leave empty to use the first CTA Form made.',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
        media: CogIcon,
      }
    },
  },
})

/** A label and a path or URL, shared by the footer's link lists. */
export const footerLinkType = defineType({
  name: 'footerLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Internal path (e.g., /about) or external URL',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})
