import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'
import {advancedField, visibilityField} from '../tabs'
import {BareField} from '../../components/controls/BareField'
import {VideoStyleInput} from '../../components/inputs/VideoStyleInput'

/*
 * Video, as in Elementor: one block for every source. The Content tab picks
 * the source and how it plays; the Style tab sets its shape and filters.
 */

export const VIDEO_SOURCES = [
  {title: 'YouTube', value: 'youtube'},
  {title: 'Vimeo', value: 'vimeo'},
  {title: 'Dailymotion', value: 'dailymotion'},
  {title: 'VideoPress', value: 'videopress'},
  {title: 'Self Hosted', value: 'hosted'},
]

export const ASPECT_RATIOS = [
  {title: '16:9', value: '16:9'},
  {title: '21:9', value: '21:9'},
  {title: '4:3', value: '4:3'},
  {title: '3:2', value: '3:2'},
  {title: '1:1', value: '1:1'},
  {title: '9:16', value: '9:16'},
]

const LINK_EXAMPLES: Record<string, string> = {
  youtube: 'https://www.youtube.com/watch?v=…',
  vimeo: 'https://vimeo.com/…',
  dailymotion: 'https://www.dailymotion.com/video/…',
  videopress: 'https://videopress.com/v/…',
}

type Parent = {source?: string; hostedExternal?: boolean} | undefined

const source = (parent: unknown) => (parent as Parent)?.source ?? 'youtube'
const isHosted = (parent: unknown) => source(parent) === 'hosted'
const isOneOf = (parent: unknown, ...sources: string[]) => sources.includes(source(parent))

/** A Video Options switch; `only` limits it to the sources that support it. */
function option(name: string, title: string, only?: string[], extra: {description?: string; initialValue?: boolean} = {}) {
  return defineField({
    name,
    title,
    type: 'boolean',
    group: 'content',
    fieldset: 'videoOptions',
    initialValue: extra.initialValue ?? false,
    description: extra.description,
    ...(only && {hidden: ({parent}: {parent?: unknown}) => !isOneOf(parent, ...only)}),
  })
}

export const videoType = defineType({
  name: 'video',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
    {name: 'advanced', title: 'Advanced'},
    {name: 'visibility', title: 'Visibility'},
  ],
  fieldsets: [{name: 'videoOptions', title: 'Video Options', options: {collapsible: false}}],
  fields: [
    // --- Content: Video ---
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'content',
      initialValue: 'youtube',
      options: {list: VIDEO_SOURCES},
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      group: 'content',
      description: 'The video’s page address, e.g. https://www.youtube.com/watch?v=…',
      hidden: ({parent}) => isHosted(parent),
      validation: (rule) =>
        rule.custom((value, {parent}) =>
          isHosted(parent) || value ? true : `Add a link, e.g. ${LINK_EXAMPLES[source(parent)] ?? 'https://…'}`,
        ),
    }),
    defineField({
      name: 'hostedExternal',
      title: 'External URL',
      type: 'boolean',
      group: 'content',
      description: 'On: play a video file from another address. Off: upload the file here.',
      initialValue: false,
      hidden: ({parent}) => !isHosted(parent),
    }),
    defineField({
      name: 'file',
      title: 'Choose Video File',
      type: 'file',
      group: 'content',
      options: {accept: 'video/*'},
      hidden: ({parent}) => !isHosted(parent) || Boolean((parent as Parent)?.hostedExternal),
    }),
    defineField({
      name: 'hostedUrl',
      title: 'Video File URL',
      type: 'url',
      group: 'content',
      description: 'A direct link to an .mp4 or .webm file.',
      hidden: ({parent}) => !isHosted(parent) || !(parent as Parent)?.hostedExternal,
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'number',
      group: 'content',
      description: 'Specify a start time (in seconds)',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'number',
      group: 'content',
      description: 'Specify an end time (in seconds)',
      // Vimeo, Dailymotion and VideoPress players have no end time.
      hidden: ({parent}) => !isOneOf(parent, 'youtube', 'hosted'),
      validation: (rule) => rule.min(0).integer(),
    }),

    // --- Content: Video Options ---
    option('autoplay', 'Autoplay', undefined, {
      description: 'Browsers only autoplay muted videos, so turn on Mute too.',
    }),
    option('mute', 'Mute'),
    option('loop', 'Loop'),
    option('controls', 'Player Controls', undefined, {initialValue: true}),
    option('captions', 'Captions', ['youtube']),
    option('privacyMode', 'Privacy Mode', ['youtube', 'vimeo'], {
      description: 'YouTube and Vimeo won’t store information about visitors unless they play the video.',
    }),
    option('lazyLoad', 'Lazy Load', ['youtube', 'vimeo', 'dailymotion', 'videopress'], {
      description: 'The player loads only when the video is scrolled near.',
    }),
    defineField({
      name: 'suggestedVideos',
      title: 'Suggested Videos',
      type: 'string',
      group: 'content',
      fieldset: 'videoOptions',
      description: 'What YouTube suggests when the video ends.',
      initialValue: 'channel',
      options: {
        list: [
          {title: 'Current Video Channel', value: 'channel'},
          {title: 'Any Video', value: 'any'},
        ],
      },
      hidden: ({parent}) => !isOneOf(parent, 'youtube'),
    }),
    option('introTitle', 'Intro Title', ['vimeo'], {initialValue: true}),
    option('introPortrait', 'Intro Portrait', ['vimeo'], {initialValue: true}),
    option('introByline', 'Intro Byline', ['vimeo'], {initialValue: true}),
    option('showLogo', 'Logo', ['dailymotion'], {initialValue: true}),
    defineField({
      name: 'controlsColor',
      title: 'Controls Color',
      type: 'string',
      group: 'content',
      fieldset: 'videoOptions',
      description: 'A hex color, e.g. #00adef.',
      validation: (rule) => rule.regex(/^#[0-9a-f]{6}$/i, {name: 'hex color'}),
      hidden: ({parent}) => !isOneOf(parent, 'vimeo', 'dailymotion'),
    }),
    option('download', 'Download Button', ['hosted']),
    defineField({
      name: 'poster',
      title: 'Poster',
      type: 'image',
      group: 'content',
      fieldset: 'videoOptions',
      description: 'Shown before the video plays.',
      hidden: ({parent}) => !isHosted(parent),
    }),

    // --- Content: Image Overlay ---
    defineField({
      name: 'imageOverlay',
      title: 'Image Overlay',
      type: 'object',
      group: 'content',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'enabled',
          title: 'Image Overlay',
          type: 'boolean',
          initialValue: false,
          description: 'Show an image over the video; clicking it plays the video.',
        }),
        defineField({
          name: 'image',
          title: 'Choose Image',
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
          hidden: ({parent}) => !(parent as {enabled?: boolean})?.enabled,
        }),
        defineField({
          name: 'playIcon',
          title: 'Play Icon',
          type: 'boolean',
          initialValue: true,
          hidden: ({parent}) => !(parent as {enabled?: boolean})?.enabled,
        }),
      ],
    }),

    // --- Style ---
    defineField({
      name: 'videoStyle',
      title: 'Video',
      type: 'object',
      group: 'style',
      // VideoStyleInput draws its own collapsible "Video" section.
      components: {input: VideoStyleInput, field: BareField},
      fields: [
        defineField({name: 'aspectRatio', title: 'Aspect Ratio', type: 'string', options: {list: ASPECT_RATIOS}}),
        defineField({
          name: 'cssFilters',
          title: 'CSS Filters',
          type: 'object',
          fields: ['blur', 'brightness', 'contrast', 'saturate', 'hue'].map((name) =>
            defineField({name, type: 'number'}),
          ),
        }),
      ],
    }),

    // --- Advanced / Visibility ---
    advancedField(),
    visibilityField(),
  ],
  preview: {
    select: {url: 'url', source: 'source', file: 'file.asset.originalFilename', hostedUrl: 'hostedUrl'},
    prepare({url, source, file, hostedUrl}: {url?: string; source?: string; file?: string; hostedUrl?: string}) {
      const label = VIDEO_SOURCES.find((s) => s.value === source)?.title ?? 'YouTube'
      return {
        title: `Video · ${label}`,
        subtitle: source === 'hosted' ? file || hostedUrl : url,
        media: PlayIcon,
      }
    },
  },
})
