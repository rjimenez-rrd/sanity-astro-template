// Lawyer profile: the source for the lawyer cards in the page builder.
import { defineArrayMember, defineField, defineType } from 'sanity'
import { UserIcon } from '@sanity/icons'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'
import { OfficeInput } from '../../components/inputs/OfficeInput'

/**
 * The lists a lawyer's profile has: one line per item, e.g. "Brooklyn School
 * of Law, J.D.". For their own page; not shown on the card.
 */
const LISTS = [
  { name: 'education', title: 'Education', example: 'Brooklyn School of Law, J.D.' },
  { name: 'barAdmissions', title: 'Bar Admissions', example: 'New York' },
  { name: 'languages', title: 'Languages', example: 'English' },
  { name: 'speakingEvents', title: 'Speaking & Events', example: 'New York State Trial Lawyers Association' },
  { name: 'publications', title: 'Publications', example: '"New York’s New Medicaid Law", Journal of the Suffolk Academy of Law, 1995' },
]

const list = (name: string, title: string, group: string, description: string) =>
  defineField({ name, title, type: 'array', group, description, of: [defineArrayMember({ type: 'string' })] })

const credentialLists = LISTS.map((l) => list(l.name, l.title, 'credentials', `One per line, e.g. ${l.example}.`))

export const lawyerType = defineType({
  name: 'lawyer',
  title: 'Lawyers',
  type: 'document',
  icon: UserIcon,
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'credentials', title: 'Credentials' },
    { name: 'contact', title: 'Contact' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'profile',
      description: 'Shown in bold on the card.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      group: 'profile',
      description: 'Shown under the name, e.g. Senior Partner.',
      validation: (rule) => rule.required(),
    }),
    // Spanish beside each English field, shown on /es/ pages; empty falls
    // back to the English. The name, photo and the rest are shared.
    defineField({
      name: 'roleEs',
      title: 'Role (Español)',
      type: 'string',
      group: 'profile',
      description: 'e.g. Socio Principal. Leave empty to show the English role.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'profile',
      description: 'Used if this lawyer ever gets their own page.',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'profile',
      description: 'Portrait. The card crops it to a 3:4 frame.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Full Bio',
      type: 'blockContent',
      group: 'profile',
      description: 'Their biography. For their own page; not shown on the card.',
    }),
    defineField({
      name: 'bioEs',
      title: 'Full Bio (Español)',
      type: 'blockContent',
      group: 'profile',
      description: 'The biography for Spanish pages. Leave empty to show the English.',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'url',
      group: 'profile',
      description: 'A YouTube video about them, e.g. https://youtu.be/0ANB2W0JS2M. Not shown on the card.',
      validation: (rule) => rule.uri({ scheme: ['https', 'http'] }),
    }),
    defineField({
      name: 'publishedAt',
      title: 'First Published',
      type: 'datetime',
      group: 'profile',
      description: 'Set the first time it is published.',
      // Stamped by the Publish action (actions/publishWithDate.ts).
      readOnly: true,
      components: { input: PublishStampInput },
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      group: 'profile',
      description: 'Set every time it is published.',
      readOnly: true,
      components: { input: PublishStampInput },
    }),

    defineField({
      name: 'practiceAreas',
      title: 'Practice Areas',
      type: 'array',
      group: 'credentials',
      description: 'The practice areas they handle. For their own page; not shown on the card.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'practiceArea' }] })],
      validation: (rule) => rule.unique(),
    }),
    ...credentialLists,

    defineField({
      name: 'office',
      title: 'Office',
      type: 'string',
      group: 'contact',
      description: 'Where they mainly work: one of the offices in Site Settings → Footer → Offices.',
      components: { input: OfficeInput },
    }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'fax', title: 'Fax', type: 'string', group: 'contact' }),
  ],
  orderings: [{ title: 'Name', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
  },
})
