import {defineType, defineField} from 'sanity'
import {BarChartIcon} from '@sanity/icons'
import {StatMetricPreview} from '../../components/previews/StatMetricPreview'

export const statMetricType = defineType({
  name: 'statMetric',
  title: 'Stat / Metric',
  type: 'object',
  icon: BarChartIcon,
  components: {
    input: StatMetricPreview,
  },
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The number or stat (e.g., "10M+", "98", "4.8").',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'What the stat measures (e.g., "Babies Helped", "Satisfaction Rate").',
    }),
    defineField({
      name: 'prefix',
      title: 'Prefix',
      type: 'string',
      description: 'Symbol before the number (e.g., "$", "#").',
    }),
    defineField({
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
      description: 'Symbol after the number (e.g., "%", "+", "★").',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      initialValue: 'medium',
      options: {
        list: [
          {title: 'Small', value: 'small'},
          {title: 'Medium', value: 'medium'},
          {title: 'Large', value: 'large'},
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
    select: {value: 'value', label: 'label', prefix: 'prefix', suffix: 'suffix'},
    prepare({
      value,
      label,
      prefix,
      suffix,
    }: {
      value?: string
      label?: string
      prefix?: string
      suffix?: string
    }) {
      return {
        title: `${prefix ?? ''}${value ?? ''}${suffix ?? ''}`,
        subtitle: label || 'Stat / Metric',
        media: BarChartIcon,
      }
    },
  },
})
