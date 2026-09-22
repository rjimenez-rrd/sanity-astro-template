import {defineType, defineField, defineArrayMember} from 'sanity'
import {UsersIcon} from '@sanity/icons'

const COLUMN_OPTIONS = [
  {title: '1 Column', value: '1'},
  {title: '2 Columns', value: '2'},
  {title: '3 Columns', value: '3'},
  {title: '4 Columns', value: '4'},
] as const

export const lawyerCardsType = defineType({
  name: 'lawyerCards',
  title: 'Lawyer Cards',
  type: 'object',
  icon: UsersIcon,
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
      name: 'lawyers',
      title: 'Lawyers',
      type: 'array',
      description: 'Pick the lawyers to show, in the order they should appear.',
      validation: (rule) => rule.required().min(1),
      of: [defineArrayMember({type: 'reference', to: [{type: 'lawyer'}]})],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '3',
      options: {list: [...COLUMN_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'showRole',
      title: 'Show Role',
      type: 'boolean',
      description: 'The line under the name, e.g. Senior Partner.',
      initialValue: true,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', lawyers: 'lawyers', first: 'lawyers.0.photo'},
    prepare({title, lawyers, first}: {title?: string; lawyers?: unknown[]; first?: unknown}) {
      const count = lawyers?.length ?? 0
      return {
        title: title || 'Lawyer Cards',
        subtitle: `${count} lawyer${count === 1 ? '' : 's'}`,
        media: first ?? UsersIcon,
      }
    },
  },
})
