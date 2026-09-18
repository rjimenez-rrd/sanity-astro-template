import {defineType, defineField, defineArrayMember} from 'sanity'
import {CogIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/ColorStringInput'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'branding', title: 'Branding', default: true},
    {name: 'navigation', title: 'Navigation'},
    {name: 'footer', title: 'Footer'},
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
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
      ],
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      group: 'branding',
    }),
    defineField({
      name: 'primaryColor',
      title: 'Primary Color',
      type: 'string',
      group: 'branding',
      description: 'Hex color (e.g., #3b82f6)',
      components: {input: ColorStringInput},
      // default color in # format
      initialValue: '#f63b99',
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Secondary Color',
      type: 'string',
      group: 'branding',
      description: 'Hex color (e.g., #10b981)',
      components: {input: ColorStringInput},
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
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Internal path (e.g., /about) or external URL',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'isButton',
              title: 'Display as Button',
              type: 'boolean',
              description: 'Renders as a CTA button instead of a plain link.',
              initialValue: false,
            }),
          ],
          preview: {
            select: {label: 'label', href: 'href', isButton: 'isButton'},
            prepare({
              label,
              href,
              isButton,
            }: {
              label?: string
              href?: string
              isButton?: boolean
            }) {
              return {
                title: label || 'Link',
                subtitle: `${href || ''}${isButton ? ' (CTA)' : ''}`,
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
                    defineField({
                      name: 'href',
                      title: 'Link',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
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
                    select: {label: 'label', href: 'href'},
                    prepare({label, href}: {label?: string; href?: string}) {
                      return {title: label || 'Item', subtitle: href}
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

    // --- Footer ---
    defineField({
      name: 'footerStyle',
      title: 'Footer Style',
      type: 'string',
      group: 'footer',
      initialValue: 'default',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Gradient', value: 'gradient'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'footerDescription',
      title: 'Footer Description',
      type: 'text',
      group: 'footer',
      rows: 3,
      description: 'Short description displayed in the footer next to the logo.',
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer Link Columns',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({
              name: 'title',
              title: 'Column Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'footerLink',
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
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: {
                    select: {label: 'label', href: 'href'},
                    prepare({label, href}: {label?: string; href?: string}) {
                      return {title: label || 'Link', subtitle: href}
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'title', links: 'links'},
            prepare({title, links}: {title?: string; links?: Array<unknown>}) {
              return {
                title: title || 'Column',
                subtitle: `${links?.length ?? 0} links`,
              }
            },
          },
        }),
      ],
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
