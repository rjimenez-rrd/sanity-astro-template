import {defineType, defineField, defineArrayMember} from 'sanity'
import {CreditCardIcon} from '@sanity/icons'
import {PricingCardPreview} from '../../components/previews/PricingCardPreview'

export const pricingCardType = defineType({
  name: 'pricingCard',
  title: 'Pricing Card',
  type: 'object',
  icon: CreditCardIcon,
  components: {
    input: PricingCardPreview,
  },
  fields: [
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      description: 'Optional badge label (e.g., "Most Popular", "Best Value").',
    }),
    defineField({
      name: 'title',
      title: 'Plan Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Name of the plan or option (e.g., "Rental", "Purchase").',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Price as text (e.g., "$149/mo", "$1,695", "From $99").',
    }),
    defineField({
      name: 'priceSubtext',
      title: 'Price Subtext',
      type: 'string',
      description: 'Text below price (e.g., "billed annually", "one-time payment").',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description: 'List of features with included/excluded status.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pricingFeature',
          title: 'Feature',
          fields: [
            defineField({
              name: 'text',
              title: 'Feature',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'included',
              title: 'Included',
              type: 'boolean',
              initialValue: true,
              description: 'Checked = included, unchecked = not included.',
            }),
          ],
          preview: {
            select: {text: 'text', included: 'included'},
            prepare({text, included}: {text?: string; included?: boolean}) {
              return {
                title: `${included !== false ? '✓' : '✗'} ${text ?? 'Feature'}`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'callToAction',
      description: 'Button at the bottom of the card.',
    }),
    defineField({
      name: 'isHighlighted',
      title: 'Highlighted',
      type: 'boolean',
      description: 'Makes this card visually prominent (thicker border, shadow).',
      initialValue: false,
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', price: 'price', badge: 'badge', isHighlighted: 'isHighlighted'},
    prepare({
      title,
      price,
      badge,
      isHighlighted,
    }: {
      title?: string
      price?: string
      badge?: string
      isHighlighted?: boolean
    }) {
      const parts = [price, badge, isHighlighted ? '★' : ''].filter(Boolean)
      return {
        title: title || 'Pricing Card',
        subtitle: parts.join(' · ') || 'Pricing Card',
        media: CreditCardIcon,
      }
    },
  },
})
