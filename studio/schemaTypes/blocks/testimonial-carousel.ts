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
    /**
     * Reviews are written once in the sidebar's Reviews section and shown from
     * there — the block never holds review text of its own. Left empty it shows
     * every review; picking some chooses which and in what order. disableNew
     * keeps the picker a picker: no inline form for writing a review here.
     */
    defineField({
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      description:
        'Leave empty to show every review, newest first. Pick reviews to choose which ones appear and in what order. Write reviews in the Reviews section.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'review'}],
          options: {disableNew: true},
        }),
      ],
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
    select: {title: 'title', reviews: 'reviews'},
    prepare({title, reviews}: {title?: string; reviews?: Array<unknown>}) {
      const count = reviews?.length ?? 0
      return {
        title: title || 'Testimonial Carousel',
        subtitle: count ? `${count} picked review${count === 1 ? '' : 's'}` : 'All reviews',
        media: UsersIcon,
      }
    },
  },
})
