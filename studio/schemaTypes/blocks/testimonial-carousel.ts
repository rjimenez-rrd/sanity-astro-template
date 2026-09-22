import {defineType, defineField, defineArrayMember} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export const testimonialCarouselType = defineType({
  name: 'testimonialCarousel',
  title: 'Testimonial Carousel',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      of: [defineArrayMember({type: 'testimonialQuote'})],
    }),
    // Mobile is always one card — anything narrower is unreadable on a phone.
    defineField({
      name: 'perViewDesktop',
      title: 'Cards per view (desktop)',
      type: 'number',
      initialValue: 3,
      options: {
        list: [
          {title: '1', value: 1},
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'perViewTablet',
      title: 'Cards per view (tablet)',
      type: 'number',
      description: 'Applies at 1024px and below. Mobile always shows one.',
      initialValue: 2,
      options: {
        list: [
          {title: '1', value: 1},
          {title: '2', value: 2},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'autoPlay',
      title: 'Auto Play',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'autoPlayInterval',
      title: 'Auto Play Interval (seconds)',
      type: 'number',
      initialValue: 5,
      validation: (rule) => rule.min(2).max(30),
      hidden: ({parent}) => !parent?.autoPlay,
    }),
    defineField({
      name: 'showDots',
      title: 'Show Dots',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'showArrows',
      title: 'Show Arrows',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', testimonials: 'testimonials'},
    prepare({title, testimonials}: {title?: string; testimonials?: Array<unknown>}) {
      return {
        title: title || 'Testimonial Carousel',
        subtitle: `${testimonials?.length ?? 0} testimonials`,
        media: UsersIcon,
      }
    },
  },
})
