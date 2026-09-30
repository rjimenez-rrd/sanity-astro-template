import {defineType, defineField, defineArrayMember, type PreviewValue} from 'sanity'
import {UsersIcon} from '@sanity/icons'
import {columnsField} from '../fields/common'

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
    columnsField({initialValue: '3'}),
    defineField({
      name: 'showRole',
      title: 'Show Role',
      type: 'boolean',
      description: 'The line under the name, e.g. Senior Partner.',
      initialValue: true,
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
    select: {title: 'title', lawyers: 'lawyers', first: 'lawyers.0.photo'},
    // The selected image value is rendered by Sanity's preview as media
    prepare({
      title,
      lawyers,
      first,
    }: {
      title?: string
      lawyers?: unknown[]
      first?: PreviewValue['media']
    }) {
      const count = lawyers?.length ?? 0
      return {
        title: title || 'Lawyer Cards',
        subtitle: `${count} lawyer${count === 1 ? '' : 's'}`,
        media: first ?? UsersIcon,
      }
    },
  },
})
