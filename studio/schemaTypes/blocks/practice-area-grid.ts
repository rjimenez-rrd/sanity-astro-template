import {defineType, defineField, defineArrayMember} from 'sanity'
import {ThListIcon} from '@sanity/icons'

/**
 * Every practice area as a grid of cards, a fixed number per page with page
 * numbers underneath — for a full Practice Areas page. For a carousel, use
 * Practice Area Cards.
 */
export const practiceAreaGridType = defineType({
  name: 'practiceAreaGrid',
  title: 'Practice Area Grid',
  type: 'object',
  icon: ThListIcon,
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
        'Leave empty to list every practice area, A–Z — new ones appear automatically. Pick some to choose which appear and in what order.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'practiceArea'}]})],
    }),
    defineField({
      name: 'perPage',
      title: 'Cards Per Page',
      type: 'number',
      description:
        'How many cards each page shows before the page numbers. Page 2 onwards lives at /<page>/page/2, /page/3…',
      initialValue: 10,
      validation: (rule) => rule.required().integer().min(1).max(48),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      description:
        'Cards across on desktop. Tablet shows two and phones one. Pick a number that divides Cards Per Page, or the last row is short — 10 per page fills 5 columns exactly.',
      initialValue: '5',
      options: {
        list: [
          {title: '2 Columns', value: '2'},
          {title: '3 Columns', value: '3'},
          {title: '4 Columns', value: '4'},
          {title: '5 Columns', value: '5'},
        ],
        layout: 'radio',
      },
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
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', practiceAreas: 'practiceAreas', perPage: 'perPage'},
    prepare({title, practiceAreas, perPage}: {title?: string; practiceAreas?: unknown[]; perPage?: number}) {
      const count = practiceAreas?.length ?? 0
      const which = count ? `${count} practice area${count === 1 ? '' : 's'}` : 'All practice areas'
      return {
        title: title || 'Practice Area Grid',
        subtitle: `${which} · ${perPage ?? 10} per page`,
        media: ThListIcon,
      }
    },
  },
})
