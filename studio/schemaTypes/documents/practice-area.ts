import {defineType, defineField} from 'sanity'
import {CaseIcon} from '@sanity/icons'
import {rootSlugField} from '../fields/rootSlug'
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
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    rootSlugField({group: 'content'}),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
      group: 'content',
    }),
    defineField({
      name: 'publishedAt',
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
    select: {title: 'title', slug: 'slug.current', media: 'coverImage'},
    prepare({title, slug, media}: {title?: string; slug?: string; media?: React.ReactNode}) {
      return {
        title: title || 'Untitled Practice Area',
        subtitle: slug ? `/${slug}` : 'No slug',
        media: media ?? CaseIcon,
      }
    },
  },
})
