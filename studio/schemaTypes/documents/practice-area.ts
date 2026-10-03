import {defineType, defineField} from 'sanity'
import {CaseIcon} from '@sanity/icons'
import {rootSlugField, parentPageField} from '../fields/rootSlug'
import {excludeFromTranslation, linkField} from '../fields/common'
import {DEFAULT_LANGUAGE} from '../languages'
import {PublishStampInput} from '../../components/inputs/PublishStampInput'
import {OfficeInput} from '../../components/inputs/OfficeInput'

/**
 * A practice area: its own page at /<slug>, laid out by a fixed template — a
 * hero, then the Page Builder content beside a sidebar — plus the image its
 * card uses on /practice-areas.
 */
export const practiceAreaType = defineType({
  name: 'practiceArea',
  title: 'Practice Area',
  type: 'document',
  icon: CaseIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'content', title: 'Content'},
    {name: 'sidebar', title: 'Sidebar'},
    {name: 'card', title: 'Listing card'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      // Set by the Translations menu (@sanity/document-internationalization).
      readOnly: true,
      hidden: true,
    }),

    // --- Hero ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'hero',
      description: 'The page’s main heading (h1).',
      validation: (rule) => rule.required(),
    }),
    rootSlugField({group: 'hero'}),
    parentPageField({group: 'hero'}),
    defineField({
      name: 'heroImage',
      title: 'Image',
      type: 'image',
      group: 'hero',
      description:
        'Optional. Shown on the right of the hero, fading into the background color. Leave empty to use the default Manhattan skyline.',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt Text'})],
    }),
    defineField({
      name: 'intro',
      title: 'Intro Text',
      type: 'blockContent',
      group: 'hero',
      description: 'The paragraphs under the title. Links are allowed.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroButton',
      title: 'Button',
      type: 'object',
      group: 'hero',
      description: 'Optional. Shown under the intro text.',
      options: {collapsible: false},
      fields: [
        defineField({name: 'label', title: 'Button Text', type: 'string'}),
        linkField('link', 'Link'),
      ],
      validation: (rule) =>
        rule.custom((value: {label?: string; link?: unknown[]} | undefined) => {
          const hasLabel = Boolean(value?.label?.trim())
          const hasLink = Boolean(value?.link?.length)
          if (hasLabel && !hasLink) return 'Add a link for the button, or clear its text.'
          if (hasLink && !hasLabel) return 'Add the button text, or remove its link.'
          return true
        }),
    }),

    // --- Content ---
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
      group: 'content',
      description: 'The main content, beside the sidebar.',
    }),
    defineField({
      name: 'publishedAt',
      // Not copied into a new translation: it starts unpublished.
      options: excludeFromTranslation(),
      title: 'First Published',
      type: 'datetime',
      group: 'content',
      description: 'Set the first time it is published.',
      // Stamped by the Publish action (actions/publishWithDate.ts).
      readOnly: true,
      components: {input: PublishStampInput},
    }),
    defineField({
      name: 'updatedAt',
      // Not copied into a new translation: it starts unpublished.
      options: excludeFromTranslation(),
      title: 'Last Updated',
      type: 'datetime',
      group: 'content',
      description: 'Set every time it is published.',
      readOnly: true,
      components: {input: PublishStampInput},
    }),

    // --- Sidebar ---
    defineField({
      name: 'sidebarForm',
      title: 'Form',
      type: 'reference',
      group: 'sidebar',
      to: [{type: 'ctaForm'}],
      description:
        'Optional. One of the CTA Forms, shown at the top of the sidebar. Leave empty to use the first CTA Form made. Spanish pages show its Spanish translation.',
    }),
    defineField({
      name: 'location',
      title: 'Office Location',
      type: 'string',
      group: 'sidebar',
      description: 'Optional. One of the offices in Site Settings → Footer → Offices.',
      components: {input: OfficeInput},
    }),
    defineField({
      name: 'relatedPages',
      title: 'Related Pages',
      type: 'array',
      group: 'sidebar',
      description: 'Optional. Listed as links in the sidebar, in this order.',
      // A new translation starts without them: they'd point at pages in this language.
      options: excludeFromTranslation(),
      of: [
        {
          type: 'reference',
          to: [{type: 'page'}, {type: 'practiceArea'}],
          options: {
            // Only pages in the same language, and never the page itself.
            filter: ({document}) => ({
              filter: '_id != $id && coalesce(language, $defaultLanguage) == $language',
              params: {
                id: document._id.replace(/^drafts\./, ''),
                language: (document.language as string | undefined) ?? DEFAULT_LANGUAGE,
                defaultLanguage: DEFAULT_LANGUAGE,
              },
            }),
          },
        },
      ],
      validation: (rule) => rule.unique(),
    }),

    // --- Listing card ---
    defineField({
      name: 'cardTitle',
      title: 'Card Title',
      type: 'text',
      rows: 2,
      group: 'card',
      description:
        'Optional. Shown on the card instead of the title, and line breaks are kept — put each word on its own line to control where it wraps.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Card Image',
      type: 'image',
      group: 'card',
      description: 'Shown in black and white on /practice-areas, in colour on hover.',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt Text'})],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  orderings: [
    {title: 'Title (A–Z)', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      media: 'coverImage',
      // Ancestors' slugs, for the full address under the title.
      p1: 'parent.slug.current',
      p2: 'parent.parent.slug.current',
      p3: 'parent.parent.parent.slug.current',
    },
    prepare({title, slug, media, p1, p2, p3}: {
      title?: string
      slug?: string
      media?: React.ReactNode
      p1?: string
      p2?: string
      p3?: string
    }) {
      return {
        title: title || 'Untitled Practice Area',
        subtitle: slug ? `/${[p3, p2, p1, slug].filter(Boolean).join('/')}` : 'No slug',
        media: media ?? CaseIcon,
      }
    },
  },
})
