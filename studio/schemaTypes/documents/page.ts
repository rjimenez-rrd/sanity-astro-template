import { defineType, defineField } from 'sanity'
import { DocumentIcon } from '@sanity/icons'
import { rootSlugField, parentPageField } from '../fields/rootSlug'
import { excludeFromTranslation } from '../fields/common'
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
    rootSlugField({ group: 'content' }),
    parentPageField({ group: 'content' }),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
      group: 'content',
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
      components: { input: PublishStampInput },
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
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'lastEditedBy',
      // Not copied into a new translation: it starts unpublished.
      options: excludeFromTranslation(),
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
      // Ancestors' slugs, for the full address under the title.
      p1: 'parent.slug.current',
      p2: 'parent.parent.slug.current',
      p3: 'parent.parent.parent.slug.current',
      name: 'lastEditedBy.name',
      image: 'lastEditedBy.image',
    },
    prepare({
      id,
      updatedAt,
      title,
      slug,
      p1,
      p2,
      p3,
      name,
      image,
    }: {
      id: string
      updatedAt?: string
      title?: string
      slug?: string
      p1?: string
      p2?: string
      p3?: string
      name?: string
      image?: string
    }) {
      const path = slug ? `/${[p3, p2, p1, slug].filter(Boolean).join('/')}` : 'No slug'
      return {
        title: title || 'Untitled Page',
        // First name only, to keep the row short.
        subtitle: name ? `${path} · ${name.split(' ')[0]}` : path,
        media: lastEditorMedia({ id, updatedAt, name, image }),
      }
    },
  },
})
