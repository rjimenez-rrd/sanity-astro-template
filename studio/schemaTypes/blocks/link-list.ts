import {defineType, defineField, defineArrayMember} from 'sanity'
import {ThListIcon} from '@sanity/icons'

/**
 * A stacked list of page links, each a full-width row with an arrow — e.g.
 * the practice areas beside a practice area page. The row for the page being
 * viewed is highlighted automatically.
 */
export const linkListType = defineType({
  name: 'linkList',
  title: 'Link List',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional, shown above the list.',
    }),
    defineField({
      name: 'source',
      title: 'Links',
      type: 'string',
      initialValue: 'practiceAreas',
      options: {
        list: [
          {title: 'All Practice Areas', value: 'practiceAreas'},
          {title: 'Pick pages', value: 'manual'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      description:
        'All Practice Areas: every practice area A–Z in the page’s language, kept up to date automatically.',
    }),
    defineField({
      name: 'items',
      title: 'Pages',
      type: 'array',
      description: 'In the order they should appear.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'page'}, {type: 'practiceArea'}]})],
      hidden: ({parent}) => parent?.source !== 'manual',
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', source: 'source', items: 'items'},
    prepare({title, source, items}: {title?: string; source?: string; items?: unknown[]}) {
      return {
        title: title || 'Link List',
        subtitle:
          source === 'manual' ? `Link List · ${items?.length ?? 0} pages` : 'Link List · All Practice Areas',
        media: ThListIcon,
      }
    },
  },
})
