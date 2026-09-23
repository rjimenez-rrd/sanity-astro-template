import {defineType, defineField, defineArrayMember} from 'sanity'
import {ThLargeIcon} from '@sanity/icons'

const COLUMN_OPTIONS = [
  {title: '1 Column', value: '1'},
  {title: '2 Columns', value: '2'},
  {title: '3 Columns', value: '3'},
  {title: '4 Columns', value: '4'},
] as const

export const practiceAreaCardsType = defineType({
  name: 'practiceAreaCards',
  title: 'Practice Area Cards',
  type: 'object',
  icon: ThLargeIcon,
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
      name: 'practiceAreas',
      title: 'Practice Areas',
      type: 'array',
      description: 'Pick the practice areas to show, in the order they should appear.',
      validation: (rule) => rule.required().min(1),
      of: [defineArrayMember({type: 'reference', to: [{type: 'practiceArea'}]})],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '3',
      options: {list: [...COLUMN_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'titleAlign',
      title: 'Title Alignment',
      type: 'string',
      description: 'Where the name sits in the bar under the image.',
      initialValue: 'center',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'stackTitleWords',
      title: 'One Word Per Line',
      type: 'boolean',
      description:
        'Breaks the name so each word gets its own line — "Car Accident" becomes two lines. A Card Title with its own line breaks wins over this.',
      initialValue: false,
    }),
    defineField({
      name: 'stackOnMobile',
      title: 'Stack On Mobile',
      type: 'boolean',
      description:
        'On phones, show every card one under the other instead of a carousel. Tablet and desktop are unaffected.',
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
    select: {title: 'title', practiceAreas: 'practiceAreas', first: 'practiceAreas.0.coverImage'},
    prepare({title, practiceAreas, first}: {title?: string; practiceAreas?: unknown[]; first?: unknown}) {
      const count = practiceAreas?.length ?? 0
      return {
        title: title || 'Practice Area Cards',
        subtitle: `${count} practice area${count === 1 ? '' : 's'}`,
        media: first ?? ThLargeIcon,
      }
    },
  },
})
