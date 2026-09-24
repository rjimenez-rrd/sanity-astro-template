import {defineType, defineField} from 'sanity'
import {LaunchIcon} from '@sanity/icons'
import {linkField} from '../fields/fields'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'
import {ButtonInput} from '../../components/inputs/ButtonInput'

export const callToActionType = defineType({
  name: 'callToAction',
  title: 'Button',
  type: 'object',
  icon: LaunchIcon,
  // Draws the four color fields as Normal / Hover tabs.
  components: {input: ButtonInput},
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
      description: 'Background on hover',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'hoverTextColor',
      title: 'Hover Text Color',
      type: 'string',
      description: 'Text color on hover',
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
      types: ['linkInternal', 'linkSitePage', 'linkExternal', 'pageSlug'],
    }),
    defineField({
      name: 'fullWidth',
      title: 'Full Width',
      type: 'boolean',
      description: 'Stretch the button across its column instead of sizing it to the label.',
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
    select: {
      title: 'label',
    },
    prepare({title}: {title?: string}) {
      return {
        title: title || 'Button',
        subtitle: 'Button',
        media: LaunchIcon,
      }
    },
  },
})
