import { defineType, defineField } from 'sanity'
import { DocumentIcon } from '@sanity/icons'
import { rootSlugField } from '../fields/rootSlug'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'
import { lastEditorMedia } from '../../components/previews/LastEditor'

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
      name: 'lastEditedBy',
      title: 'Last Edited By',
      type: 'object',
      // Set on edit by actions/stampLastEditor.ts; only the list row shows it.
      hidden: true,
      fields: [
        defineField({ name: 'id', type: 'string' }),
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'image', type: 'url' }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      id: '_id',
      updatedAt: '_updatedAt',
      title: 'title',
      slug: 'slug.current',
      name: 'lastEditedBy.name',
      image: 'lastEditedBy.image',
    },
    prepare({
      id,
      updatedAt,
      title,
      slug,
      name,
      image,
    }: {
      id: string
      updatedAt?: string
      title?: string
      slug?: string
      name?: string
      image?: string
    }) {
      const path = slug ? `/${slug}` : 'No slug'
      return {
        title: title || 'Untitled Page',
        // First name only, to keep the row short.
        subtitle: name ? `${path} · ${name.split(' ')[0]}` : path,
        media: lastEditorMedia({ id, updatedAt, name, image }),
      }
    },
  },
})
