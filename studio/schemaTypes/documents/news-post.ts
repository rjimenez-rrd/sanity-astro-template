import {defineField, defineType, type SlugValidationContext} from 'sanity'
import {DocumentsIcon} from '@sanity/icons'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'
import {excludeFromTranslation} from '../fields/common'
import {DEFAULT_LANGUAGE} from '../languages'

/**
 * A slug only has to be unique among posts in the same language: a Spanish
 * translation starts as a copy, slug included, and /news/<slug> and
 * /es/news/<slug> don't collide.
 */
async function isUniqueInLanguage(slug: string, context: SlugValidationContext) {
  const id = context.document?._id.replace(/^drafts\./, '')
  if (!id) return true
  // Posts from before languages existed have none; they're the default.
  const language = (context.document?.language as string | undefined) ?? DEFAULT_LANGUAGE
  const client = context.getClient({apiVersion: '2025-03-20'})
  const taken = await client.fetch<boolean>(
    `defined(*[_type == "newsPost" && slug.current == $slug && !sanity::versionOf($id)
      && coalesce(language, $defaultLanguage) == $language][0]._id)`,
    {slug, id, language, defaultLanguage: DEFAULT_LANGUAGE},
  )
  return !taken
}

/** A news article, published at /news/<slug>, and /es/news/<slug> in Spanish. */
export const newsPostType = defineType({
  name: 'newsPost',
  title: 'News',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description: 'The article lives at /news/<slug> (Spanish: /es/news/<slug>).',
      options: {source: 'title', maxLength: 96, isUnique: isUniqueInLanguage},
      validation: (rule) => rule.required(),
    }),
    // defineField({
    //   name: 'publishedAt',
    //   title: 'Date',
    //   type: 'date',
    //   group: 'content',
    //   description: 'Shown on the card and the article. Newest first in lists.',
    //   initialValue: () => new Date().toISOString().slice(0, 10),
    //   validation: (rule) => rule.required(),
    // }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'content',
      to: [{type: 'newsCategory'}],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'content',
      description: 'Used on the card and at the top of the article.',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt Text'})],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'A sentence or two, for search results and social previews.',
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
      group: 'content',
      description: 'The article itself, built from Containers like any page.',
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
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'dateDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', date: 'publishedAt', category: 'category.title', media: 'coverImage'},
    prepare({
      title,
      date,
      category,
      media,
    }: {
      title?: string
      date?: string
      category?: string
      media?: unknown
    }) {
      return {
        title: title || 'Untitled news',
        subtitle: [date, category].filter(Boolean).join(' · '),
        media: (media as never) ?? DocumentsIcon,
      }
    },
  },
})
