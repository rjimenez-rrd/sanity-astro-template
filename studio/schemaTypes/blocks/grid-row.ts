import {defineType, defineField, defineArrayMember} from 'sanity'
import {DashboardIcon, SplitVerticalIcon} from '@sanity/icons'
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
import {linkField} from '../fields/fields'

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

/**
 * Every block a column can hold, A–Z by the name the insert menu shows, so a
 * block is found by its name rather than by knowing which group it was in.
 * Keep new blocks in order — the trailing comment is that name.
 *
 * An Inner Container ("Column") is offered only in a top-level Container's
 * columns — nesting stops at one level, since the page query can't recurse —
 * which is why it is a parameter.
 */
const contentMembers = (withColumn: boolean) => [
  defineArrayMember({type: 'accordion'}), // Accordion
  defineArrayMember({type: 'alertNotice'}), // Alert / Notice
  defineArrayMember({type: 'callToAction'}), // Button
  defineArrayMember({type: 'buttonGroup'}), // Button Group
  defineArrayMember({type: 'caseResultCards'}), // Case Results
  defineArrayMember({type: 'codeBlock'}), // Code Block
  ...(withColumn ? [defineArrayMember({type: 'nestedContainer'})] : []), // Column
  defineArrayMember({type: 'countdownTimer'}), // Countdown Timer
  defineArrayMember({type: 'htmlBlock'}), // Custom HTML
  defineArrayMember({type: 'externalVideo'}), // External Video
  defineArrayMember({type: 'faqBlock'}), // FAQ
  defineArrayMember({type: 'featureCardGrid'}), // Feature Card Grid
  defineArrayMember({type: 'formBlock'}), // Form
  defineArrayMember({type: 'formCta'}), // Form CTA
  defineArrayMember({type: 'iconText'}), // Icon + Text
  defineArrayMember({type: 'imageBlock'}), // Image
  defineArrayMember({type: 'imageGallery'}), // Image Gallery
  defineArrayMember({type: 'lawyerCards'}), // Lawyer Cards
  defineArrayMember({type: 'logoRow'}), // Logo Row
  defineArrayMember({type: 'lottieAnimation'}), // Lottie Animation
  defineArrayMember({type: 'mapEmbed'}), // Map Embed
  defineArrayMember({type: 'newsCards'}), // News Cards
  defineArrayMember({type: 'phoneBlock'}), // Phone
  defineArrayMember({type: 'practiceAreaCards'}), // Practice Area Cards
  defineArrayMember({type: 'practiceAreaGrid'}), // Practice Area Grid
  defineArrayMember({type: 'pricingCard'}), // Pricing Card
  defineArrayMember({type: 'richTextBlock'}), // Rich Text
  defineArrayMember({type: 'socialEmbed'}), // Social Embed
  defineArrayMember({type: 'spacerDivider'}), // Spacer / Divider
  defineArrayMember({type: 'statMetric'}), // Stat / Metric
  defineArrayMember({type: 'tabbedContent'}), // Tabbed Content
  defineArrayMember({type: 'dataTable'}), // Table
  defineArrayMember({type: 'tocBlock'}), // Table of Contents
  defineArrayMember({type: 'testimonialCarousel'}), // Testimonial Carousel
  defineArrayMember({type: 'testimonialQuote'}), // Testimonial Quote
  defineArrayMember({type: 'youtubeVideo'}), // YouTube Video
]

/**
 * Builds a container type. The top-level Container's columns can also hold an
 * Inner Container; an Inner Container's own columns can't, so nesting stops at
 * one level — the page query can't recurse, so it projects to that same depth.
 */
function defineContainerType({nested}: {nested: boolean}) {
  // Shown as "Column" in a column's insert menu. The type name stays
  // nestedContainer, so anything already saved keeps working.
  const kind = nested ? 'Column' : 'Container'
  return defineType({
    name: nested ? 'nestedContainer' : 'gridRow',
    title: kind,
    type: 'object',
    icon: nested ? SplitVerticalIcon : DashboardIcon,
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
      containerField('row', {item: nested}),

      defineField({
        name: 'layout',
        title: 'Layout Preset',
        type: 'string',
        group: 'layout',
        description:
          'Pick a column structure. In Grid mode it sets the grid tracks; in Flexbox it seeds how many columns to add and how wide each one starts.',
        // An Inner Container is usually one box inside a column, not a split.
        initialValue: nested ? 'full' : '50-50',
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
        initialValue: () => (nested ? [createColumn()] : [createColumn(), createColumn()]),
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
                of: contentMembers(!nested),
                options: {
                  insertMenu: {
                    views: [{name: 'grid'}],
                  },
                },
              }),
              designField(),
              styleField(),
              advancedField(),
              {
                ...linkField('link', 'Link'),
                group: 'advanced',
                description:
                  'Makes the whole column clickable. Buttons and links inside it still go to their own pages.',
              },
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
          title: named || `${kind} — ${mode}`,
          subtitle: named ? `${mode} · ${items}` : items,
          media: nested ? SplitVerticalIcon : DashboardIcon,
        }
      },
    },
  })
}

export const gridRowType = defineContainerType({nested: false})

/**
 * A Container inside a column, so part of a column gets its own flex layout,
 * background and alignment without moving the blocks around it — e.g. a
 * vertically centered box under a video, with the video left where it is.
 */
export const nestedContainerType = defineContainerType({nested: true})
