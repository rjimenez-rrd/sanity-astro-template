import {defineType, defineField} from 'sanity'
import {ClockIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

const TIMEZONE_OPTIONS = [
  {title: 'US Pacific (Los Angeles)', value: 'America/Los_Angeles'},
  {title: 'US Mountain (Denver)', value: 'America/Denver'},
  {title: 'US Central (Chicago)', value: 'America/Chicago'},
  {title: 'US Eastern (New York)', value: 'America/New_York'},
  {title: 'UK (London)', value: 'Europe/London'},
  {title: 'Australia (Sydney)', value: 'Australia/Sydney'},
  {title: 'Australia (Melbourne)', value: 'Australia/Melbourne'},
]

export const countdownTimerType = defineType({
  name: 'countdownTimer',
  title: 'Countdown Timer',
  type: 'object',
  icon: ClockIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'Headline above the countdown (e.g., "Spring Sale ends in...").',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'content',
      description: 'Optional text below the headline.',
    }),
    defineField({
      name: 'targetDate',
      title: 'Target Date & Time',
      type: 'datetime',
      group: 'content',
      description: 'When the countdown reaches zero.',
      validation: (rule) => rule.required(),
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15,
      },
    }),
    defineField({
      name: 'timezone',
      title: 'Timezone',
      type: 'string',
      group: 'content',
      description: 'Timezone for the target date.',
      initialValue: 'America/Los_Angeles',
      options: {
        list: TIMEZONE_OPTIONS,
      },
    }),
    defineField({
      name: 'expiredMessage',
      title: 'Expired Message',
      type: 'string',
      group: 'content',
      description: 'Text shown after the countdown ends (e.g., "This offer has ended").',
    }),
    defineField({
      name: 'hideWhenExpired',
      title: 'Hide When Expired',
      type: 'boolean',
      group: 'content',
      description: 'Completely hide this section after the countdown ends.',
      initialValue: false,
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'callToAction',
      group: 'content',
      description: 'Optional button alongside the timer.',
    }),
    defineField({
      name: 'style',
      title: 'Display Style',
      type: 'string',
      group: 'style',
      initialValue: 'large',
      options: {
        list: [
          {title: 'Large (full-width banner)', value: 'large'},
          {title: 'Compact (inline strip)', value: 'compact'},
          {title: 'Inline (within content)', value: 'inline'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'style',
      description: 'Hex color (e.g., #1a1a2e).',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      group: 'style',
      description: 'Hex color (e.g., #ffffff).',
      components: {input: ColorStringInput},
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
    select: {title: 'title', targetDate: 'targetDate'},
    prepare({title, targetDate}: {title?: string; targetDate?: string}) {
      const dateStr = targetDate
        ? new Date(targetDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'No date set'
      return {
        title: title || 'Countdown Timer',
        subtitle: `Ends: ${dateStr}`,
        media: ClockIcon,
      }
    },
  },
})
