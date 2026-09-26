import {defineType, defineField} from 'sanity'
import {MobileDeviceIcon} from '@sanity/icons'

/**
 * The firm's phone, placed anywhere a block can go. The number, its display
 * text and the label all come from Site Settings → Branding, so every Phone
 * block (and the header, footer and inline phones) stays the same. Only how
 * it looks is set here.
 */
export const phoneBlockType = defineType({
  name: 'phoneBlock',
  title: 'Phone',
  type: 'object',
  icon: MobileDeviceIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'show',
      title: 'Show',
      type: 'string',
      group: 'content',
      initialValue: 'display',
      options: {
        list: [
          {title: 'As displayed, e.g. (833) SANDERS', value: 'display'},
          {title: 'The number, e.g. (516) 591-3208', value: 'number'},
        ],
        layout: 'radio',
      },
      description: 'Both dial the Phone Number from Site Settings.',
    }),
    defineField({
      name: 'showLabel',
      title: 'Show Label',
      type: 'boolean',
      group: 'content',
      initialValue: true,
      description: 'The line above the number, e.g. "Free Consultation 24/7".',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      group: 'content',
      description: 'Leave empty to use the Phone Label from Site Settings.',
      hidden: ({parent}) => parent?.showLabel === false,
    }),
    defineField({
      name: 'numberStyle',
      title: 'Number',
      type: 'textStyle',
      group: 'style',
      options: {collapsible: true, collapsed: false},
    }),
    defineField({
      name: 'labelStyle',
      title: 'Label',
      type: 'textStyle',
      group: 'style',
      options: {collapsible: true, collapsed: true},
      hidden: ({parent}) => parent?.showLabel === false,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      group: 'style',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {show: 'show', label: 'label', showLabel: 'showLabel'},
    prepare({show, label, showLabel}: {show?: string; label?: string; showLabel?: boolean}) {
      return {
        title: 'Phone',
        subtitle: [
          show === 'number' ? 'Number' : 'As displayed',
          showLabel === false ? 'no label' : label || 'Site Settings label',
        ].join(' · '),
        media: MobileDeviceIcon,
      }
    },
  },
})
