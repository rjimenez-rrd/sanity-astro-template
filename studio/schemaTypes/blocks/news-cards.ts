import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentsIcon} from '@sanity/icons'

const COLUMN_OPTIONS = [
  {title: '1 Column', value: '1'},
  {title: '2 Columns', value: '2'},
  {title: '3 Columns', value: '3'},
  {title: '4 Columns', value: '4'},
] as const

type Parent = {source?: string; autoPlay?: boolean} | undefined

export const newsCardsType = defineType({
  name: 'newsCards',
  title: 'News Cards',
  type: 'object',
  icon: DocumentsIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2}),
    defineField({
      name: 'source',
      title: 'Show',
      type: 'string',
      initialValue: 'latest',
      options: {
        list: [
          {title: 'Latest news', value: 'latest'},
          {title: 'Pick them myself', value: 'manual'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'count',
      title: 'How Many',
      type: 'number',
      description: 'The newest ones, up to this many.',
      initialValue: 6,
      validation: (rule) => rule.min(1).max(24).integer(),
      hidden: ({parent}) => (parent as Parent)?.source === 'manual',
    }),
    defineField({
      name: 'category',
      title: 'Only From Category',
      type: 'reference',
      to: [{type: 'newsCategory'}],
      description: 'Optional. Leave empty for every category.',
      hidden: ({parent}) => (parent as Parent)?.source === 'manual',
    }),
    defineField({
      name: 'newsPosts',
      title: 'News',
      type: 'array',
      description: 'In the order they should appear.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'newsPost'}]})],
      hidden: ({parent}) => (parent as Parent)?.source !== 'manual',
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.parent as Parent)?.source === 'manual' && !(value as unknown[] | undefined)?.length
            ? 'Pick at least one'
            : true,
        ),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '3',
      options: {list: [...COLUMN_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'tabletColumns',
      title: 'Columns (tablet)',
      type: 'string',
      description:
        'For screens 768–1024px wide. Leave empty for automatic — half the columns above, at most 2.',
      options: {list: [...COLUMN_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'stackOnMobile',
      title: 'Stack On Mobile',
      type: 'boolean',
      description: 'On phones, show every card one under the other instead of a carousel.',
      initialValue: false,
    }),
    defineField({
      name: 'autoPlay',
      title: 'Auto Play',
      type: 'boolean',
      description: 'Advance a page at a time on its own. Only runs when there is more than one page.',
      initialValue: false,
    }),
    defineField({
      name: 'autoPlayInterval',
      title: 'Auto Play Interval (seconds)',
      type: 'number',
      initialValue: 5,
      validation: (rule) => rule.min(2).max(30),
      hidden: ({parent}) => !(parent as Parent)?.autoPlay,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', source: 'source', count: 'count', picked: 'newsPosts'},
    prepare({
      title,
      source,
      count,
      picked,
    }: {
      title?: string
      source?: string
      count?: number
      picked?: unknown[]
    }) {
      return {
        title: title || 'News Cards',
        subtitle:
          source === 'manual'
            ? `${picked?.length ?? 0} picked`
            : `Latest ${count ?? 6}`,
        media: DocumentsIcon,
      }
    },
  },
})
