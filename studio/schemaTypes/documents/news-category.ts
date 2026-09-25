import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'

/**
 * A news category — Awards & Accolades, Team Updates, Case Results — kept as
 * its own document so editors can add one without a code change, and so a
 * News Cards block can be filtered to a single category.
 */
export const newsCategoryType = defineType({
  name: 'newsCategory',
  title: 'News Categories',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'First Published',
      type: 'datetime',
      description: 'Set the first time it is published.',
      // Stamped by the Publish action (actions/publishWithDate.ts).
      readOnly: true,
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Set every time it is published.',
      readOnly: true,
      components: { input: PublishStampInput },
    }),
  ],
  preview: { select: { title: 'title' } },
})
