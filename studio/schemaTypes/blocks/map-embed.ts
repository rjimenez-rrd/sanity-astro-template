import {defineType, defineField} from 'sanity'
import {PinIcon} from '@sanity/icons'

export const mapEmbedType = defineType({
  name: 'mapEmbed',
  title: 'Map Embed',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'embedUrl',
      title: 'Google Maps URL',
      type: 'url',
      description: 'Paste a Google Maps share or embed URL.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'height',
      title: 'Height (preset)',
      type: 'string',
      description:
        'Default height. To match the column height, or set an exact height and width, use Block Styles → Size & Alignment below — it overrides this preset.',
      initialValue: 'medium',
      options: {
        list: [
          {title: 'Small (200px)', value: 'small'},
          {title: 'Medium (300px)', value: 'medium'},
          {title: 'Large (400px)', value: 'large'},
          {title: 'XL (500px)', value: 'xl'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional text below the map.',
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      initialValue: 'rounded',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Rounded', value: 'rounded'},
          {title: 'Borderless', value: 'borderless'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      // Open by default here (unlike other blocks): Size & Alignment inside it
      // is where "fill column height" and an exact height/width live, and a
      // map is the block most likely to need them right away.
      options: {collapsible: true, collapsed: false},
    }),
  ],
  preview: {
    select: {caption: 'caption', embedUrl: 'embedUrl'},
    prepare({caption, embedUrl}: {caption?: string; embedUrl?: string}) {
      return {
        title: caption || 'Map Embed',
        subtitle: embedUrl ? 'Google Maps' : 'No URL set',
        media: PinIcon,
      }
    },
  },
})
