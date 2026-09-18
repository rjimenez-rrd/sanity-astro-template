import {defineType, defineField, defineArrayMember} from 'sanity'
import {DashboardIcon} from '@sanity/icons'
import {LayoutPickerInput} from '../../components/LayoutPickerInput'
import {ColumnsInput} from '../../components/ColumnsInput'
import {
  CONTAINER_GROUPS,
  advancedField,
  containerField,
  styleField,
  visibilityField,
} from '../shared/container'
import {designField} from '../shared/design'

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

/** Rows saved before the container settings existed have no `container`. */
const isLegacyRow = (parent: ContainerParent) => !parent?.container

/** The grid template picker only matters in Grid mode (and for legacy rows). */
const usesGridTemplate = (parent: ContainerParent) =>
  isLegacyRow(parent) || parent?.container?.layoutType === 'grid'

export const gridRowType = defineType({
  name: 'gridRow',
  title: 'Container',
  type: 'object',
  icon: DashboardIcon,
  groups: CONTAINER_GROUPS,
  fieldsets: [
    {
      name: 'legacy',
      title: 'Legacy layout',
      description: 'Used by rows created before the container settings. Saved container settings replace these.',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // --- Layout tab ---
    containerField('row'),

    defineField({
      name: 'layout',
      title: 'Grid Template',
      type: 'string',
      group: 'layout',
      description: 'Column widths for Grid mode. Columns stack on mobile.',
      initialValue: '50-50',
      hidden: ({parent}) => !usesGridTemplate(parent as ContainerParent),
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
            defineField({
              name: 'verticalAlign',
              title: 'Align Self (older rows only)',
              type: 'string',
              group: 'advanced',
              description:
                'Only used when the row has no container settings. In a container, columns always match the tallest column — use Justify Content on the Layout tab to position the content.',
              initialValue: 'top',
              options: {
                list: [
                  {title: 'Top', value: 'top'},
                  {title: 'Center', value: 'center'},
                  {title: 'Bottom', value: 'bottom'},
                ],
              },
            }),
            designField(),
            styleField(),
            advancedField(),
            visibilityField(),
          ],
          preview: {
            select: {content: 'content', width: 'container.width.desktop'},
            prepare({
              content,
              width,
            }: {
              content?: Array<unknown>
              width?: {size?: number; unit?: string}
            }) {
              const blockCount = content?.length ?? 0
              const widthLabel = width?.size !== undefined ? ` · ${width.size}${width.unit ?? ''}` : ''
              return {
                title: 'Column',
                subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}${widthLabel}`,
              }
            },
          },
        }),
      ],
    }),

    // --- Legacy fields: only shown on rows without container settings ---
    defineField({
      name: 'gap',
      title: 'Column Gap',
      type: 'string',
      group: 'layout',
      fieldset: 'legacy',
      hidden: ({parent}) => !isLegacyRow(parent as ContainerParent),
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Extra Large', value: 'xl'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'reverseOnMobile',
      title: 'Reverse order on mobile',
      type: 'boolean',
      group: 'layout',
      fieldset: 'legacy',
      hidden: ({parent}) => !isLegacyRow(parent as ContainerParent),
    }),
    defineField({
      name: 'paddingY',
      title: 'Vertical Padding',
      type: 'string',
      group: 'layout',
      fieldset: 'legacy',
      hidden: ({parent}) => !isLegacyRow(parent as ContainerParent),
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Extra Large', value: 'xl'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'layout',
      fieldset: 'legacy',
      hidden: ({parent}) => !isLegacyRow(parent as ContainerParent),
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Narrow (768px)', value: 'narrow'},
          {title: 'Default (1200px)', value: 'default'},
          {title: 'Wide (1400px)', value: 'wide'},
          {title: 'Full Width', value: 'full'},
        ],
      },
    }),

    // --- Style / Advanced / Visibility tabs ---
    designField(),
    styleField(),
    advancedField(),
    visibilityField(),
  ],
  preview: {
    select: {layout: 'layout', columns: 'columns', layoutType: 'container.layoutType'},
    prepare({
      layout,
      columns,
      layoutType,
    }: {
      layout?: string
      columns?: Array<unknown>
      layoutType?: string
    }) {
      const colCount = columns?.length ?? 0
      const mode =
        layoutType === 'flex'
          ? 'Flexbox'
          : `Grid ${LAYOUT_OPTIONS.find((o) => o.value === layout)?.title ?? layout ?? ''}`.trim()
      return {
        title: `Container — ${mode}`,
        subtitle: `${colCount} item${colCount !== 1 ? 's' : ''}`,
        media: DashboardIcon,
      }
    },
  },
})
