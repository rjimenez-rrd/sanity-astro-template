import {defineType, defineField, defineArrayMember} from 'sanity'
import {DashboardIcon} from '@sanity/icons'
import {randomKey} from '@sanity/util/content'
import {LayoutPickerInput} from '../../components/inputs/LayoutPickerInput'
import {ColumnsInput} from '../../components/inputs/ColumnsInput'
import {COLUMN_CONTAINER_DEFAULTS} from '../../components/container/defaults'
import {
  CONTAINER_GROUPS,
  advancedField,
  containerField,
  styleField,
  visibilityField,
} from '../fields/container'
import {designField} from '../fields/design'

const LAYOUT_OPTIONS = [
  {title: 'Full Width', value: 'full'},
  {title: '50 / 50', value: '50-50'},
  {title: '33 / 66', value: '33-66'},
  {title: '66 / 33', value: '66-33'},
  {title: '25 / 75', value: '25-75'},
  {title: '75 / 25', value: '75-25'},
  {title: '33 / 33 / 33', value: '33-33-33'},
  {title: '25 / 50 / 25', value: '25-50-25'},
  {title: '25 / 25 / 25 / 25', value: '25-25-25-25'},
] as const

type ContainerParent = {container?: {layoutType?: string}} | undefined

/** Mirrors createEmptyColumn in ColumnsInput so both entry points agree. */
const createColumn = () => ({
  _type: 'gridColumn',
  _key: randomKey(12),
  container: {...COLUMN_CONTAINER_DEFAULTS},
})

/** The grid template picker defines real tracks only in Grid mode. */
const usesGridTemplate = (parent: ContainerParent) =>
  parent?.container?.layoutType === 'grid'

export const gridRowType = defineType({
  name: 'gridRow',
  title: 'Container',
  type: 'object',
  icon: DashboardIcon,
  groups: CONTAINER_GROUPS,
  fields: [
    // --- Layout tab ---
    defineField({
      name: 'label',
      title: 'Name',
      type: 'string',
      group: 'layout',
      description: 'Shown in the Page Builder list, so you can tell containers apart.',
    }),
    containerField('row'),

    defineField({
      name: 'layout',
      title: 'Layout Preset',
      type: 'string',
      group: 'layout',
      description:
        'Pick a column structure. In Grid mode it sets the grid tracks; in Flexbox it seeds how many columns to add and how wide each one starts.',
      initialValue: '50-50',
      validation: (rule) =>
        rule.custom((value, context) =>
          usesGridTemplate(context.parent as ContainerParent) && !value
            ? 'Pick a grid template'
            : true,
        ),
      components: {
        input: LayoutPickerInput,
      },
    }),

    defineField({
      name: 'columns',
      title: 'Items',
      type: 'array',
      group: 'layout',
      description: 'Each item is a column inside this container. Open one to edit its own layout and style.',
      // A new container starts valid, instead of greeting the editor with a
      // required-field error before they have done anything.
      initialValue: () => [createColumn(), createColumn()],
      validation: (rule) => rule.required().min(1),
      components: {
        input: ColumnsInput,
      },
      of: [
        defineArrayMember({
          type: 'object',
          name: 'gridColumn',
          title: 'Column',
          groups: CONTAINER_GROUPS,
          fields: [
            defineField({
              name: 'label',
              title: 'Name',
              type: 'string',
              group: 'layout',
              description: 'Shown in the item list, so you can tell columns apart.',
            }),
            containerField('column'),
            defineField({
              name: 'content',
              title: 'Content',
              type: 'array',
              group: 'layout',
              of: [
                // Rich text & media
                defineArrayMember({type: 'richTextBlock'}),
                defineArrayMember({type: 'imageBlock'}),
                defineArrayMember({type: 'callToAction'}),
                defineArrayMember({type: 'externalVideo'}),
                defineArrayMember({type: 'youtubeVideo'}),
                // Interactive
                defineArrayMember({type: 'tabbedContent'}),
                defineArrayMember({type: 'accordion'}),
                defineArrayMember({type: 'spacerDivider'}),
                defineArrayMember({type: 'countdownTimer'}),
                // Display
                defineArrayMember({type: 'iconText'}),
                defineArrayMember({type: 'buttonGroup'}),
                defineArrayMember({type: 'statMetric'}),
                defineArrayMember({type: 'testimonialQuote'}),
                defineArrayMember({type: 'alertNotice'}),
                defineArrayMember({type: 'pricingCard'}),
                // Embeds & data
                defineArrayMember({type: 'socialEmbed'}),
                defineArrayMember({type: 'logoRow'}),
                defineArrayMember({type: 'mapEmbed'}),
                defineArrayMember({type: 'codeBlock'}),
                defineArrayMember({type: 'dataTable'}),
                defineArrayMember({type: 'lottieAnimation'}),
                // Forms & FAQ
                defineArrayMember({type: 'formBlock'}),
                defineArrayMember({type: 'faqBlock'}),
                // Grids & galleries
                defineArrayMember({type: 'featureCardGrid'}),
                defineArrayMember({type: 'testimonialCarousel'}),
                defineArrayMember({type: 'imageGallery'}),
                defineArrayMember({type: 'tocBlock'}),
              ],
              options: {
                insertMenu: {
                  views: [{name: 'grid'}],
                },
              },
            }),
            designField(),
            styleField(),
            advancedField(),
            visibilityField(),
          ],
          preview: {
            select: {label: 'label', content: 'content', width: 'container.width.desktop'},
            prepare({
              label,
              content,
              width,
            }: {
              label?: string
              content?: Array<unknown>
              width?: {size?: number; unit?: string}
            }) {
              const blockCount = content?.length ?? 0
              const widthLabel = width?.size !== undefined ? ` · ${width.size}${width.unit ?? ''}` : ''
              return {
                title: label?.trim() || 'Column',
                subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}${widthLabel}`,
              }
            },
          },
        }),
      ],
    }),


    // --- Style / Advanced / Visibility tabs ---
    designField(),
    styleField(),
    advancedField(),
    visibilityField(),
  ],
  preview: {
    select: {
      label: 'label',
      layout: 'layout',
      columns: 'columns',
      layoutType: 'container.layoutType',
    },
    prepare({
      label,
      layout,
      columns,
      layoutType,
    }: {
      label?: string
      layout?: string
      columns?: Array<unknown>
      layoutType?: string
    }) {
      const colCount = columns?.length ?? 0
      const mode =
        layoutType === 'flex'
          ? 'Flexbox'
          : `Grid ${LAYOUT_OPTIONS.find((o) => o.value === layout)?.title ?? layout ?? ''}`.trim()
      const items = `${colCount} item${colCount !== 1 ? 's' : ''}`
      const named = label?.trim()
      // A name replaces the title, so the mode moves into the subtitle rather
      // than being lost.
      return {
        title: named || `Container — ${mode}`,
        subtitle: named ? `${mode} · ${items}` : items,
        media: DashboardIcon,
      }
    },
  },
})
