import {defineType, defineField, defineArrayMember} from 'sanity'
import {TrendUpwardIcon} from '@sanity/icons'

const COLUMN_OPTIONS = [
  {title: '1 Column', value: '1'},
  {title: '2 Columns', value: '2'},
  {title: '3 Columns', value: '3'},
  {title: '4 Columns', value: '4'},
] as const

export const caseResultCardsType = defineType({
  name: 'caseResultCards',
  title: 'Case Results',
  type: 'object',
  icon: TrendUpwardIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'caseResults',
      title: 'Case Results',
      type: 'array',
      description: 'Pick the results to show, in the order they should appear.',
      validation: (rule) => rule.required().min(1),
      of: [defineArrayMember({type: 'reference', to: [{type: 'caseResult'}]})],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '3',
      options: {list: [...COLUMN_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'showResultType',
      title: 'Show Result Type',
      type: 'boolean',
      description: 'The label above the amount, e.g. Settlement. Only shows where one is set.',
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
      hidden: ({parent}) => !parent?.autoPlay,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', caseResults: 'caseResults'},
    prepare({title, caseResults}: {title?: string; caseResults?: unknown[]}) {
      const count = caseResults?.length ?? 0
      return {
        title: title || 'Case Results',
        subtitle: `${count} result${count === 1 ? '' : 's'}`,
        media: TrendUpwardIcon,
      }
    },
  },
})
