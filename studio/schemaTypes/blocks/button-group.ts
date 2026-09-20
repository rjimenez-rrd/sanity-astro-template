import {defineType, defineField, defineArrayMember} from 'sanity'
import {InlineElementIcon} from '@sanity/icons'
import {ButtonGroupInput} from '../../components/inputs/ButtonGroupInput'

export const buttonGroupType = defineType({
  name: 'buttonGroup',
  title: 'Button Group',
  type: 'object',
  icon: InlineElementIcon,
  fields: [
    defineField({
      name: 'buttons',
      title: 'Buttons',
      type: 'array',
      description: 'Add up to 4 buttons.',
      validation: (rule) => rule.required().min(1).max(4),
      of: [defineArrayMember({type: 'callToAction'})],
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
      },
    }),
    defineField({
      name: 'direction',
      title: 'Direction',
      type: 'string',
      initialValue: 'horizontal',
      components: {
        input: ButtonGroupInput,
      },
    }),
    defineField({
      name: 'gap',
      title: 'Gap',
      type: 'string',
      initialValue: 'medium',
      options: {
        list: [
          {title: 'Small', value: 'small'},
          {title: 'Medium', value: 'medium'},
          {title: 'Large', value: 'large'},
        ],
        layout: 'radio',
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
    select: {buttons: 'buttons', direction: 'direction'},
    prepare({buttons, direction}: {buttons?: Array<unknown>; direction?: string}) {
      const count = buttons?.length ?? 0
      return {
        title: 'Button Group',
        subtitle: `${count} button${count !== 1 ? 's' : ''} · ${direction ?? 'horizontal'}`,
        media: InlineElementIcon,
      }
    },
  },
})
