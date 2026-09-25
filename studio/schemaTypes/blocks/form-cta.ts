import {defineType, defineField} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

/**
 * Places a Form CTA from the Studio's Form CTAs list. The content lives in
 * that document, so the same CTA can sit on many pages and is edited once.
 *
 * The content fields below are only for blocks made before Form CTAs were
 * documents: they're kept so those blocks still render, but hidden, and a
 * picked Form CTA always wins over them.
 */
const LEGACY_FIELDS: Record<string, string> = {
  eyebrow: 'string',
  heading: 'text',
  description: 'text',
  form: 'formBlock',
  image: 'image',
  outlineText: 'text',
  backgroundColor: 'string',
  headingFont: 'string',
  outlineFont: 'string',
}

export const formCtaType = defineType({
  name: 'formCta',
  title: 'Form CTA',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'cta',
      title: 'Form CTA',
      type: 'reference',
      to: [{type: 'ctaForm'}],
      description: 'Pick one from Form CTAs, or create a new one here. Edits there show on every page using it.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {heading?: string} | undefined
          // Older blocks still carry their own content until a Form CTA is picked.
          return value || parent?.heading ? true : 'Pick a Form CTA'
        }),
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
    // Hidden: see LEGACY_FIELDS above.
    ...Object.entries(LEGACY_FIELDS).map(([name, type]) => defineField({name, type, hidden: true})),
  ],
  preview: {
    select: {name: 'cta.name', heading: 'cta.heading', legacy: 'heading', media: 'cta.image'},
    prepare({name, heading, legacy, media}) {
      return {
        title: name || legacy || 'Form CTA',
        subtitle: heading ? `Form CTA · ${heading}` : 'Form CTA',
        media: media ?? EnvelopeIcon,
      }
    },
  },
})
