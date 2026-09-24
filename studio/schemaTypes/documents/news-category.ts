import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons'

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
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'title'}},
})
