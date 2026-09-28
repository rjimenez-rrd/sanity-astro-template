// Lawyer profile: the source for the lawyer cards in the page builder.
import { defineField, defineType, defineArrayMember } from 'sanity'
import { UserIcon } from '@sanity/icons'
import { PublishStampInput } from '../../components/inputs/PublishStampInput'

export const lawyerType = defineType({
  name: 'lawyer',
  title: 'Lawyers',
  type: 'document',
  icon: UserIcon,
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'credentials', title: 'Credentials' },
    { name: 'contact', title: 'Contact' },
    { name: 'spanish', title: 'Español' },
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
      name: 'shortBio',
      title: 'Short Bio',
      type: 'text',
      rows: 3,
      group: 'profile',
      description: 'One or two lines, for listings.',
    }),
    defineField({
      name: 'bio',
      title: 'Full Bio',
      type: 'blockContent',
      group: 'profile',
    }),
    // Spanish versions, shown on /es/ pages. Empty ones fall back to English;
    // the name, photo and everything else are shared.
    defineField({
      name: 'roleEs',
      title: 'Role (Español)',
      type: 'string',
      group: 'spanish',
      description: 'e.g. Socio Principal. Leave empty to show the English role.',
    }),
    defineField({
      name: 'shortBioEs',
      title: 'Short Bio (Español)',
      type: 'text',
      rows: 3,
      group: 'spanish',
    }),
    defineField({
      name: 'bioEs',
      title: 'Full Bio (Español)',
      type: 'blockContent',
      group: 'spanish',
    }),
    defineField({
      name: 'order',
      title: 'Sort Order',
      type: 'number',
      group: 'profile',
      description: 'Lower numbers come first where lawyers are listed automatically.',
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
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'practiceArea' }] })],
    }),
    defineField({
      name: 'barAdmissions',
      title: 'Bar Admissions',
      type: 'array',
      group: 'credentials',
      description: 'e.g. New York, New Jersey.',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'languages',
      title: 'Languages',
      type: 'array',
      group: 'credentials',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'array',
      group: 'credentials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'education',
          fields: [
            defineField({ name: 'school', title: 'School', type: 'string' }),
            defineField({ name: 'degree', title: 'Degree', type: 'string' }),
            defineField({ name: 'year', title: 'Year', type: 'string' }),
          ],
          preview: {
            select: { title: 'school', degree: 'degree', year: 'year' },
            prepare({ title, degree, year }: { title?: string; degree?: string; year?: string }) {
              return {
                title: title || 'School',
                subtitle: [degree, year].filter(Boolean).join(' · '),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'awards',
      title: 'Awards & Recognition',
      type: 'array',
      group: 'credentials',
      of: [defineArrayMember({ type: 'string' })],
    }),

    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'contact',
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }],
    },
    { title: 'Name', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
  },
})
