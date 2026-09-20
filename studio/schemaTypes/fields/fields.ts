import {defineField, defineArrayMember} from 'sanity'

/** Simple string field helper */
export function stringField(
  name: string,
  title: string,
  opts?: {
    required?: boolean
    description?: string
    group?: string
    hidden?: boolean | ((ctx: {parent?: Record<string, unknown>}) => boolean)
    rows?: number
  },
) {
  return defineField({
    name,
    title,
    type: opts?.rows ? 'text' : 'string',
    description: opts?.description,
    group: opts?.group,
    hidden: opts?.hidden as never,
    validation: opts?.required ? (rule) => rule.required() : undefined,
    ...(opts?.rows ? {rows: opts.rows} : {}),
  })
}

/** Image with hotspot and plain string alt text */
export function imageWithAlt(
  name: string,
  title: string,
  opts?: {
    required?: boolean
    description?: string
    group?: string
  },
) {
  return defineField({
    name,
    title,
    type: 'image',
    description: opts?.description,
    group: opts?.group,
    options: {hotspot: true},
    validation: opts?.required ? (rule) => rule.required() : undefined,
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt Text',
        type: 'string',
        description: 'Describe this image for accessibility',
      }),
    ],
  })
}

/** Link array field (max 1, for CTA buttons) */
export function linkField(
  name: string,
  title: string,
  opts?: {
    required?: boolean
    types?: string[]
  },
) {
  const types = opts?.types ?? ['linkInternal', 'linkExternal', 'pageSlug']
  return defineField({
    name,
    title,
    type: 'array',
    of: types.map((t) => defineArrayMember({type: t})),
    validation: opts?.required
      ? (rule) => rule.required().max(1)
      : (rule) => rule.max(1),
  })
}
