// customer review schema
import { defineField, defineType } from 'sanity'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'

export const reviewType = defineType({
  name: 'review',
  title: 'Reviews',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'reviewText',
      title: 'Review Text',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    // Spanish versions, shown on /es/ pages; empty ones fall back to the
    // English. The client's name and the rating are shared.
    defineField({
      name: 'titleEs',
      title: 'Title (Español)',
      type: 'string',
    }),
    defineField({
      name: 'reviewTextEs',
      title: 'Review Text (Español)',
      type: 'text',
      description: 'Leave empty to show the English review on Spanish pages.',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: 'publishedAt',
      title: 'First Published',
      type: 'datetime',
      description: 'Set the first time it is published.',
      // Stamped by the Publish action (actions/publishWithDate.ts).
      readOnly: true,
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Set every time it is published.',
      readOnly: true,
      components: { input: PublishStampInput },
    }),
  ],
  // Listed by the client's name, since many reviews have no title; the title
  // (or the start of the review) and the stars underneath.
  preview: {
    select: { clientName: 'clientName', title: 'title', reviewText: 'reviewText', rating: 'rating' },
    prepare({
      clientName,
      title,
      reviewText,
      rating,
    }: {
      clientName?: string
      title?: string
      reviewText?: string
      rating?: number
    }) {
      const stars = rating ? '★'.repeat(Math.round(rating)) : ''
      return {
        title: clientName || 'Unnamed client',
        subtitle: [stars, title || reviewText].filter(Boolean).join(' · '),
      }
    },
  },
})