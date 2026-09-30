import {defineType, defineField, defineArrayMember, type PreviewValue} from 'sanity'
import {ThLargeIcon} from '@sanity/icons'
import {columnsField} from '../fields/common'

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
      description:
        'Leave empty to show every practice area, A–Z — new ones appear automatically. Pick some to choose which appear and in what order.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'practiceArea'}]})],
    }),
    columnsField({initialValue: '3'}),
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
    // The selected image value is rendered by Sanity's preview as media
    prepare({
      title,
      practiceAreas,
      first,
    }: {
      title?: string
      practiceAreas?: unknown[]
      first?: PreviewValue['media']
    }) {
      const count = practiceAreas?.length ?? 0
      return {
        title: title || 'Practice Area Cards',
        subtitle: count ? `${count} practice area${count === 1 ? '' : 's'}` : 'All practice areas',
        media: first ?? ThLargeIcon,
      }
    },
  },
})
