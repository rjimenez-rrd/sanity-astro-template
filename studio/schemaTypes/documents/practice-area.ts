import {defineType, defineField} from 'sanity'
import {CaseIcon} from '@sanity/icons'
import {rootSlugField, parentPageField} from '../fields/rootSlug'
import {PublishStampInput} from '../../components/inputs/PublishStampInput'

/**
 * A practice area: its own page at /<slug>, built with the Page Builder like
 * any Page, plus the image its card uses on /practice-areas.
 */
export const practiceAreaType = defineType({
  name: 'practiceArea',
  title: 'Practice Area',
  type: 'document',
  icon: CaseIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
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
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    rootSlugField({group: 'content'}),
    parentPageField({group: 'content'}),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
      group: 'content',
    }),
    defineField({
      name: 'publishedAt',
      // Not copied into a new translation: it starts unpublished.
      options: {documentInternationalization: {exclude: true}},
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
      options: {documentInternationalization: {exclude: true}},
      title: 'Last Updated',
      type: 'datetime',
      group: 'content',
      description: 'Set every time it is published.',
      readOnly: true,
      components: {input: PublishStampInput},
    }),
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
