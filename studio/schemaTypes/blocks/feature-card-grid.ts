import {defineType, defineField, defineArrayMember} from 'sanity'
import {ThLargeIcon} from '@sanity/icons'
import {COLUMN_OPTIONS, columnsField} from '../fields/common'

const STYLE_OPTIONS = [
  {title: 'Simple', value: 'simple'},
  {title: 'Bordered', value: 'bordered'},
  {title: 'Shadow', value: 'shadow'},
  {title: 'Highlighted', value: 'highlighted'},
] as const

export const featureCardGridType = defineType({
  name: 'featureCardGrid',
  title: 'Feature Card Grid',
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
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'featureCard',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              options: {hotspot: true},
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'cta',
              title: 'Link',
              type: 'object',
              fields: [
                defineField({name: 'label', title: 'Label', type: 'string'}),
                defineField({name: 'href', title: 'URL', type: 'string'}),
              ],
            }),
          ],
          preview: {
            select: {title: 'title', media: 'icon'},
            prepare({title, media}: {title?: string; media?: React.ReactNode}) {
              return {title: title || 'Feature Card', media}
            },
          },
        }),
      ],
    }),
    // No single-column layout for this grid
    columnsField({initialValue: '3', options: COLUMN_OPTIONS.slice(1)}),
    defineField({
      name: 'style',
      title: 'Card Style',
      type: 'string',
      initialValue: 'simple',
      options: {list: [...STYLE_OPTIONS], layout: 'radio'},
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', cards: 'cards'},
    prepare({title, cards}: {title?: string; cards?: Array<unknown>}) {
      return {
        title: title || 'Feature Card Grid',
        subtitle: `${cards?.length ?? 0} cards`,
        media: ThLargeIcon,
      }
    },
  },
})
