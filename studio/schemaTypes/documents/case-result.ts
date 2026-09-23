// Case result: the source for the case result cards in the page builder.
import {defineField, defineType, defineArrayMember} from 'sanity'
import {TrendUpwardIcon} from '@sanity/icons'

export const caseResultType = defineType({
  name: 'caseResult',
  title: 'Case Results',
  type: 'document',
  icon: TrendUpwardIcon,
  fields: [
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'string',
      description: 'The figure on the card, exactly as it should read — e.g. $1.75M.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      description: 'The line under the amount, e.g. Fall Down Stairs Results in Multiple Surgeries.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resultType',
      title: 'Result Type',
      type: 'string',
      description: 'Optional label above the amount.',
      options: {
        list: [
          {title: 'Settlement', value: 'Settlement'},
          {title: 'Verdict', value: 'Verdict'},
          {title: 'Award', value: 'Award'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'practiceAreas',
      title: 'Practice Areas',
      type: 'array',
      description: 'Where this result belongs. Not shown on the card.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'practiceArea'}]})],
    }),
    defineField({
      name: 'order',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers come first where results are listed automatically.',
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}, {field: 'amount', direction: 'desc'}],
    },
    {title: 'Amount', name: 'amountDesc', by: [{field: 'amount', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'amount', subtitle: 'summary'},
  },
})
