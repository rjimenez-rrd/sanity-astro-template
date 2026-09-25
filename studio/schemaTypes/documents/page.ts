import { defineType, defineField } from 'sanity'
import { DocumentIcon } from '@sanity/icons'
import { rootSlugField } from '../fields/rootSlug'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'

/**
 * A page at /<slug>, built with the Page Builder. Grouped like a Practice
 * Area: the page itself under Content, search metadata under SEO.
 */
export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    rootSlugField({ group: 'content' }),
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
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      group: 'content',
      description: 'Set every time it is published.',
      readOnly: true,
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }: { title?: string; slug?: string }) {
      return {
        title: title || 'Untitled Page',
        subtitle: slug ? `/${slug}` : 'No slug',
        media: DocumentIcon,
      }
    },
  },
})
