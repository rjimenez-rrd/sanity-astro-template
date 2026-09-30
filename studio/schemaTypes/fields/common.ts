import {defineField, defineArrayMember} from 'sanity'

/** Grid column choices shared by the card blocks (stored as strings) */
export const COLUMN_OPTIONS = [
  {title: '1 Column', value: '1'},
  {title: '2 Columns', value: '2'},
  {title: '3 Columns', value: '3'},
  {title: '4 Columns', value: '4'},
] as const

type ColumnOption = (typeof COLUMN_OPTIONS)[number]

/** Radio string field for picking a grid column count */
export function columnsField(opts?: {
  name?: string
  title?: string
  description?: string
  initialValue?: ColumnOption['value']
  options?: readonly ColumnOption[]
}) {
  return defineField({
    name: opts?.name ?? 'columns',
    title: opts?.title ?? 'Columns',
    type: 'string',
    description: opts?.description,
    initialValue: opts?.initialValue,
    options: {list: [...(opts?.options ?? COLUMN_OPTIONS)], layout: 'radio'},
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
  const types = opts?.types ?? ['linkInternal', 'linkSitePage', 'linkExternal', 'pageSlug']
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

/**
 * Field options that keep a field out of the copy @sanity/document-internationalization
 * makes for a new translation. Sanity's option types don't know the plugin's key,
 * so the result is typed as the field's own options.
 */
export function excludeFromTranslation<T extends object = {}>(options?: T): T {
  return {...options, documentInternationalization: {exclude: true}} as T
}
