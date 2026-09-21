import {defineType, defineField} from 'sanity'
import {CaseIcon} from '@sanity/icons'
import {rootSlugField} from '../fields/rootSlug'

/**
 * A practice area: its own page at /<slug>, built with the Page Builder like
 * any Page, and listed separately in the Studio.
 */
export const practiceAreaType = defineType({
  name: 'practiceArea',
  title: 'Practice Area',
  type: 'document',
  icon: CaseIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
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
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}: {title?: string; slug?: string}) {
      return {
        title: title || 'Untitled Practice Area',
        subtitle: slug ? `/${slug}` : 'No slug',
        media: CaseIcon,
      }
    },
  },
})
