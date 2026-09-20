import {defineType, defineField} from 'sanity'
import {LaunchIcon} from '@sanity/icons'
import {linkField} from '../fields/fields'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

export const callToActionType = defineType({
  name: 'callToAction',
  title: 'Call to Action',
  type: 'object',
  icon: LaunchIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color e.g. #FF6B35',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      description: 'Hex color for button text',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'hoverColor',
      title: 'Hover Color',
      type: 'string',
      description: 'Hex color on hover',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'primary',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
          {title: 'Outline', value: 'outline'},
          {title: 'Ghost', value: 'ghost'},
        ],
        layout: 'radio',
      },
    }),
    linkField('link', 'Link', {
      required: true,
      types: ['linkInternal', 'linkExternal', 'pageSlug'],
    }),
  ],
  preview: {
    select: {
      title: 'label',
    },
    prepare({title}: {title?: string}) {
      return {
        title: title || 'Call to Action',
        subtitle: 'Call to Action',
        media: LaunchIcon,
      }
    },
  },
})
