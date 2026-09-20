import {defineType, defineField} from 'sanity'
import {CommentIcon} from '@sanity/icons'
import {TestimonialPreview} from '../../components/previews/TestimonialPreview'

export const testimonialQuoteType = defineType({
  name: 'testimonialQuote',
  title: 'Testimonial Quote',
  type: 'object',
  icon: CommentIcon,
  components: {
    input: TestimonialPreview,
  },
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The testimonial text.',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      description: 'Photo of the person.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: "Person's name.",
    }),
    defineField({
      name: 'title',
      title: 'Title / Role',
      type: 'string',
      description: 'Position or context (e.g., "Pediatrician", "Parent of twins").',
    }),
    defineField({
      name: 'rating',
      title: 'Star Rating',
      type: 'number',
      description: 'Optional 1-5 star rating.',
      validation: (rule) => rule.min(1).max(5).integer(),
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      initialValue: 'card',
      options: {
        list: [
          {title: 'Simple (text only)', value: 'simple'},
          {title: 'Card (with background)', value: 'card'},
          {title: 'Large (big quote marks)', value: 'large'},
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
    select: {quote: 'quote', name: 'name', media: 'avatar'},
    prepare({quote, name, media}: {quote?: string; name?: string; media?: any}) {
      const displayQuote = quote && quote.length > 50 ? `${quote.slice(0, 50)}...` : quote
      return {
        title: displayQuote || 'Testimonial',
        subtitle: name || 'Testimonial Quote',
        media: media ?? CommentIcon,
      }
    },
  },
})
