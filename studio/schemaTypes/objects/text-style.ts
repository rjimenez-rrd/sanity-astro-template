import {defineType, defineField} from 'sanity'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'
import {BUNDLED_FONTS} from '../fonts'

/**
 * How one piece of text looks: font, weight, size per screen, color, spacing
 * and a text shadow. Every field is optional; an empty one keeps what the text
 * would have anyway. Rendered by frontend lib/textStyle.ts.
 */
export const textStyleType = defineType({
  name: 'textStyle',
  title: 'Text Style',
  type: 'object',
  fieldsets: [
    {name: 'size', title: 'Size (px)', options: {columns: 3}},
    {name: 'shadow', title: 'Text Shadow', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'font',
      title: 'Font',
      type: 'string',
      options: {list: BUNDLED_FONTS},
      description: 'Leave empty to keep the surrounding font.',
    }),
    defineField({
      name: 'weight',
      title: 'Weight',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: '300'},
          {title: 'Normal', value: '400'},
          {title: 'Medium', value: '500'},
          {title: 'Semibold', value: '600'},
          {title: 'Bold', value: '700'},
          {title: 'Extra Bold', value: '800'},
          {title: 'Black', value: '900'},
        ],
      },
      description: 'Inter and Montserrat have every weight; the others have Normal and Bold (Bebas Neue and Anton only Normal).',
    }),
    defineField({name: 'fontSize', title: 'Desktop', type: 'number', fieldset: 'size', validation: (rule) => rule.min(1).max(400)}),
    defineField({name: 'fontSizeTablet', title: 'Tablet', type: 'number', fieldset: 'size', validation: (rule) => rule.min(1).max(400)}),
    defineField({name: 'fontSizeMobile', title: 'Mobile', type: 'number', fieldset: 'size', validation: (rule) => rule.min(1).max(400)}),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'letterSpacing',
      title: 'Letter Spacing (px)',
      type: 'number',
      description: 'Negative tightens, positive spreads out. E.g. 1 or -0.5.',
      validation: (rule) => rule.min(-20).max(50),
    }),
    defineField({
      name: 'textTransform',
      title: 'Letter Case',
      type: 'string',
      options: {
        list: [
          {title: 'As typed', value: 'none'},
          {title: 'UPPERCASE', value: 'uppercase'},
          {title: 'lowercase', value: 'lowercase'},
          {title: 'Capitalize Each Word', value: 'capitalize'},
        ],
      },
    }),
    defineField({name: 'italic', title: 'Italic', type: 'boolean'}),
    defineField({
      name: 'shadowColor',
      title: 'Color',
      type: 'string',
      fieldset: 'shadow',
      components: {input: ColorStringInput},
      description: 'Set a color to turn the shadow on.',
    }),
    defineField({name: 'shadowX', title: 'Horizontal (px)', type: 'number', fieldset: 'shadow', initialValue: 0}),
    defineField({name: 'shadowY', title: 'Vertical (px)', type: 'number', fieldset: 'shadow', initialValue: 2}),
    defineField({name: 'shadowBlur', title: 'Blur (px)', type: 'number', fieldset: 'shadow', initialValue: 4, validation: (rule) => rule.min(0)}),
  ],
})
