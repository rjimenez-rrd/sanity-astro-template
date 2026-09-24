import {defineType, defineField} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

/**
 * A reusable lead-capture section: heading and a form on one side, a cut-out
 * image with outlined text behind it on the other. Written once here and
 * placed on any page with the Form CTA block, so every page showing it
 * updates together. The form is a regular Form block, with every field,
 * submit and message option that block has.
 */
export const formCtaSectionType = defineType({
  name: 'formCtaSection',
  title: 'Form CTA',
  type: 'document',
  icon: EnvelopeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'form', title: 'Form'},
    {name: 'media', title: 'Image'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'content',
      description: 'Only for the Studio, to tell your Form CTAs apart, e.g. "Free Case Review".',
      validation: (rule) => rule.required(),
    }),
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
  ],
  preview: {
    select: {title: 'name', subtitle: 'heading', media: 'image'},
    prepare({title, subtitle, media}) {
      return {title: title || 'Form CTA', subtitle, media: media ?? EnvelopeIcon}
    },
  },
})
