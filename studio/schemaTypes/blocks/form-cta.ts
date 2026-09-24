import {defineType, defineField} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

/**
 * A lead-capture section: heading and a form on one side, a cut-out image with
 * outlined text behind it on the other. The form is a regular Form block, so
 * it has every field, submit and message option that block has.
 */
export const formCtaType = defineType({
  name: 'formCta',
  title: 'Form CTA',
  type: 'object',
  icon: EnvelopeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'form', title: 'Form'},
    {name: 'media', title: 'Image'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      description: 'The small line above the heading.',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'Line breaks are kept.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'form',
      title: 'Form',
      type: 'formBlock',
      group: 'form',
      description: 'Always shown in the On Dark style here.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      group: 'media',
      description: 'A cut-out PNG or WebP with a transparent background works best. It sits on the bottom edge.',
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt Text'})],
    }),
    defineField({
      name: 'outlineText',
      title: 'Outline Text',
      type: 'text',
      rows: 3,
      group: 'media',
      description: 'Large outlined words behind the image, e.g. TRUSTED BY INJURED NEW YORKERS. Line breaks are kept.',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'style',
      description: 'Leave empty for no color of its own, so the Container background shows through. Pick the Primary swatch for the brand blue.',
      components: {input: ColorStringInput},
    }),
    defineField({
      name: 'headingFont',
      title: 'Heading Font',
      type: 'string',
      group: 'style',
      description: 'Any Google Font. Leave empty for Libre Baskerville.',
    }),
    defineField({
      name: 'outlineFont',
      title: 'Outline Text Font',
      type: 'string',
      group: 'style',
      description: 'Any Google Font. Leave empty for Bebas Neue.',
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
    select: {title: 'heading', subtitle: 'eyebrow', media: 'image'},
    prepare({title, subtitle, media}) {
      return {title: title || 'Form CTA', subtitle: subtitle || 'Form CTA', media: media ?? EnvelopeIcon}
    },
  },
})
