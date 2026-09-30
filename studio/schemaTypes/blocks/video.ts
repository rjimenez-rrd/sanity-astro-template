import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'
import {advancedField, styleEffectsField, visibilityField} from '../tabs'

export const youtubeVideoType = defineType({
  name: 'youtubeVideo',
  title: 'YouTube Video',
  type: 'object',
  icon: PlayIcon,
  groups: [ 
    {name: 'content', title: 'Content'},
    {name: 'style', title: 'Style'},
    {name: 'advanced', title: 'Advanced'},
    {name: 'visibility', title: 'Visibility'}
  ],
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      group: 'content',
      description: 'e.g., https://www.youtube.com/watch?v=...',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      group: 'content',
    }),
    styleEffectsField(),
    advancedField(),
    visibilityField()
  ],
  preview: {
    select: {url: 'url', caption: 'caption'},
    prepare({url, caption}: {url?: string; caption?: string}) {
      return {
        title: caption || 'YouTube Video',
        subtitle: url,
        media: PlayIcon,
      }
    },
  },
})

export const externalVideoType = defineType({
  name: 'externalVideo',
  title: 'External Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'MP4 or HLS video URL',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'autoplay',
      title: 'Autoplay',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'loop',
      title: 'Loop',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'muted',
      title: 'Muted',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {url: 'url', caption: 'caption'},
    prepare({url, caption}: {url?: string; caption?: string}) {
      return {
        title: caption || 'External Video',
        subtitle: url,
        media: PlayIcon,
      }
    },
  },
})
