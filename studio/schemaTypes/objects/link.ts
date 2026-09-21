import {defineType, defineField} from 'sanity'
import {LinkIcon, EarthGlobeIcon, LaunchIcon} from '@sanity/icons'

export const linkInternalType = defineType({
  name: 'linkInternal',
  title: 'Internal Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'reference',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}, {type: 'practiceArea'}],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', pageTitle: 'reference.title'},
    prepare({title, pageTitle}: {title?: string; pageTitle?: string}) {
      return {
        title: title || pageTitle || 'Internal Link',
        subtitle: 'Internal',
        media: LinkIcon,
      }
    },
  },
})

export const linkExternalType = defineType({
  name: 'linkExternal',
  title: 'External Link',
  type: 'object',
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({scheme: ['http', 'https', 'mailto', 'tel']}),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title', url: 'url'},
    prepare({title, url}: {title?: string; url?: string}) {
      return {
        title: title || url || 'External Link',
        subtitle: url,
        media: EarthGlobeIcon,
      }
    },
  },
})

export const pageSlugType = defineType({
  name: 'pageSlug',
  title: 'Page Slug',
  type: 'object',
  icon: LaunchIcon,
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
      type: 'string',
      description: 'e.g., /about or /contact',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug'},
    prepare({title, slug}: {title?: string; slug?: string}) {
      return {
        title: title || 'Page Slug',
        subtitle: slug,
        media: LaunchIcon,
      }
    },
  },
})
