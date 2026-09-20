import {defineType, defineField} from 'sanity'
import {BulbOutlineIcon} from '@sanity/icons'
import {IconTextAlignmentInput} from '../../components/inputs/IconTextAlignmentInput'

export const iconTextType = defineType({
  name: 'iconText',
  title: 'Icon + Text',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description: 'Icon or small illustration (SVG or PNG recommended).',
    }),
    defineField({
      name: 'iconSize',
      title: 'Icon Size',
      type: 'string',
      initialValue: 'medium',
      options: {
        list: [
          {title: 'Small (32px)', value: 'small'},
          {title: 'Medium (48px)', value: 'medium'},
          {title: 'Large (64px)', value: 'large'},
          {title: 'XL (80px)', value: 'xl'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Feature name or heading.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Short supporting text (1-2 sentences).',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      initialValue: 'center',
      components: {
        input: IconTextAlignmentInput,
      },
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'callToAction',
      description: 'Optional — makes the entire block clickable or adds a link below.',
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'icon', alignment: 'alignment'},
    prepare({title, media, alignment}: {title?: string; media?: any; alignment?: string}) {
      return {
        title: title || 'Icon + Text',
        subtitle: `Icon + Text · ${alignment ?? 'center'}`,
        media: media ?? BulbOutlineIcon,
      }
    },
  },
})
