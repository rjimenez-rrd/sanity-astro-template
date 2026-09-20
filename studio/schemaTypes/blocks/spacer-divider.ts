import {defineType, defineField} from 'sanity'
import {RemoveIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

export const spacerDividerType = defineType({
  name: 'spacerDivider',
  title: 'Spacer / Divider',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    defineField({
      name: 'height',
      title: 'Height',
      type: 'string',
      description: 'Amount of vertical space.',
      initialValue: 'md',
      validation: (rule) => rule.required(),
      options: {
        list: [
          {title: 'Extra Small (16px)', value: 'xs'},
          {title: 'Small (32px)', value: 'sm'},
          {title: 'Medium (48px)', value: 'md'},
          {title: 'Large (64px)', value: 'lg'},
          {title: 'Extra Large (96px)', value: 'xl'},
          {title: 'XXL (128px)', value: 'xxl'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'showDivider',
      title: 'Show Divider Line',
      type: 'boolean',
      description: 'Display a horizontal line in the center of the spacer.',
      initialValue: false,
    }),
    defineField({
      name: 'dividerStyle',
      title: 'Divider Style',
      type: 'string',
      description: 'Line style for the divider.',
      hidden: ({parent}) => !parent?.showDivider,
      initialValue: 'solid',
      options: {
        list: [
          {title: 'Solid', value: 'solid'},
          {title: 'Dashed', value: 'dashed'},
          {title: 'Dotted', value: 'dotted'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'dividerColor',
      title: 'Divider Color',
      type: 'string',
      description: 'Hex color for the line (e.g., #e5e7eb).',
      hidden: ({parent}) => !parent?.showDivider,
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      description: 'How wide the divider line extends.',
      hidden: ({parent}) => !parent?.showDivider,
      initialValue: 'default',
      options: {
        list: [
          {title: 'Narrow (768px)', value: 'narrow'},
          {title: 'Default (1200px)', value: 'default'},
          {title: 'Wide (1400px)', value: 'wide'},
          {title: 'Full Width', value: 'full'},
        ],
      },
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {height: 'height', showDivider: 'showDivider'},
    prepare({height, showDivider}: {height?: string; showDivider?: boolean}) {
      const label = showDivider ? 'Divider' : 'Spacer'
      const sizeLabel =
        {xs: 'XS', sm: 'SM', md: 'MD', lg: 'LG', xl: 'XL', xxl: 'XXL'}[height ?? 'md'] ?? height
      return {
        title: `${label} — ${sizeLabel}`,
        subtitle: showDivider ? 'With line' : 'Empty space',
        media: RemoveIcon,
      }
    },
  },
})
