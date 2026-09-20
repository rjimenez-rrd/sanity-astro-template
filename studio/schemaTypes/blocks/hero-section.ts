import {defineType, defineField, defineArrayMember} from 'sanity'
import {RocketIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

export const heroSectionType = defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  icon: RocketIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'background', title: 'Background'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      group: 'content',
      initialValue: 'fullWidth',
      options: {
        list: [
          {title: 'Full Width (overlay)', value: 'fullWidth'},
          {title: 'Split (text + media)', value: 'split'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'badge',
      title: 'Badge Text',
      type: 'string',
      group: 'content',
      description: 'Small pill badge above the heading',
    }),
    defineField({
      name: 'badgeLink',
      title: 'Badge Link',
      type: 'string',
      group: 'content',
      description: 'Optional URL for the badge',
    }),
    defineField({
      name: 'heading',
      title: 'Heading (H1)',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'alignment',
      title: 'Text Alignment',
      type: 'string',
      group: 'content',
      initialValue: 'center',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'buttons',
      title: 'Buttons',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'callToAction'})],
      validation: (rule) => rule.max(3),
    }),

    // Media (split layout)
    defineField({
      name: 'mediaImage',
      title: 'Media Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
      ],
      hidden: ({parent}) => parent?.layout !== 'split',
    }),
    defineField({
      name: 'mediaPosition',
      title: 'Media Position',
      type: 'string',
      group: 'media',
      initialValue: 'right',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      hidden: ({parent}) => parent?.layout !== 'split',
    }),

    // Background
    defineField({
      name: 'backgroundType',
      title: 'Background Type',
      type: 'string',
      group: 'background',
      initialValue: 'color',
      options: {
        list: [
          {title: 'Color', value: 'color'},
          {title: 'Gradient', value: 'gradient'},
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
      },
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'background',
      description: 'Hex color',
      hidden: ({parent}) => parent?.backgroundType !== 'color',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'gradientFrom',
      title: 'Gradient From',
      type: 'string',
      group: 'background',
      description: 'Start hex color',
      hidden: ({parent}) => parent?.backgroundType !== 'gradient',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'gradientTo',
      title: 'Gradient To',
      type: 'string',
      group: 'background',
      description: 'End hex color',
      hidden: ({parent}) => parent?.backgroundType !== 'gradient',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'gradientDirection',
      title: 'Gradient Direction',
      type: 'string',
      group: 'background',
      initialValue: 'to bottom right',
      options: {
        list: [
          {title: 'To Bottom', value: 'to bottom'},
          {title: 'To Bottom Right', value: 'to bottom right'},
          {title: 'To Right', value: 'to right'},
          {title: 'To Top Right', value: 'to top right'},
        ],
      },
      hidden: ({parent}) => parent?.backgroundType !== 'gradient',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      group: 'background',
      hidden: ({parent}) => parent?.backgroundType !== 'image',
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Background Video URL',
      type: 'url',
      group: 'background',
      description: 'Direct video file URL (mp4)',
      hidden: ({parent}) => parent?.backgroundType !== 'video',
    }),
    defineField({
      name: 'overlay',
      title: 'Overlay Opacity',
      type: 'number',
      group: 'background',
      description: '0 = none, 100 = fully opaque black overlay',
      initialValue: 0,
      validation: (rule) => rule.min(0).max(100),
      hidden: ({parent}) =>
        !['image', 'video'].includes(parent?.backgroundType as string),
    }),

    // Style
    defineField({
      name: 'minHeight',
      title: 'Minimum Height',
      type: 'string',
      group: 'style',
      initialValue: '75vh',
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: '50vh', value: '50vh'},
          {title: '75vh', value: '75vh'},
          {title: '100vh (Full Screen)', value: '100vh'},
        ],
      },
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      group: 'style',
      description: 'Hex color for heading and subtitle',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'maxWidth',
      title: 'Content Max Width',
      type: 'string',
      group: 'style',
      initialValue: 'default',
      options: {
        list: [
          {title: 'Narrow (768px)', value: 'narrow'},
          {title: 'Default (1200px)', value: 'default'},
          {title: 'Wide (1400px)', value: 'wide'},
        ],
      },
    }),
    defineField({
      name: 'blockStyles',
      title: 'Advanced Styles',
      type: 'blockStyles',
      group: 'style',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {heading: 'heading', layout: 'layout'},
    prepare({heading, layout}: {heading?: string; layout?: string}) {
      return {
        title: heading || 'Hero Section',
        subtitle: `Hero — ${layout === 'split' ? 'Split' : 'Full Width'}`,
        media: RocketIcon,
      }
    },
  },
})
