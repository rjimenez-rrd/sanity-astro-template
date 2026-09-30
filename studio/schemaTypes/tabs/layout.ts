import {defineField} from 'sanity'
import {BareField} from '../../components/controls/BareField'
import {LayoutInput, type ContainerVariant} from '../../components/tabs/layout/LayoutInput'
import {
  COLUMN_CONTAINER_DEFAULTS,
  ROW_CONTAINER_DEFAULTS,
} from '../../components/tabs/layout/layoutDefaults'

const DEVICES = ['desktop', 'tablet', 'mobile'] as const

function responsiveString(name: string, title: string, values: string[]) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: DEVICES.map((device) =>
      defineField({
        name: device,
        type: 'string',
        options: {list: values},
      }),
    ),
  })
}

function responsiveSize(name: string, title: string, units: string[]) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: DEVICES.map((device) =>
      defineField({
        name: device,
        type: 'object',
        fields: [
          defineField({name: 'size', type: 'number'}),
          defineField({name: 'unit', type: 'string', options: {list: units}}),
        ],
      }),
    ),
  })
}

const FLEX_POSITIONS = ['flex-start', 'center', 'flex-end']

/** Layout tab: the whole Elementor "Container" panel, rendered by one input. */
/**
 * `item` marks an inner Column: it sits inside another column, so its Width is
 * its size as an item there (like a column's), not a boxed content width.
 */
export function layoutField(variant: ContainerVariant, {item = false}: {item?: boolean} = {}) {
  return defineField({
    name: 'container',
    title: 'Container',
    type: 'object',
    group: 'layout',
    options: {variant, item} as Record<string, unknown>,
    components: {
      input: LayoutInput,
      // LayoutInput draws its own collapsible "Container" header, so
      // the default field wrapper would stack a second identical label above it.
      field: BareField,
    },
    initialValue: variant === 'row' ? ROW_CONTAINER_DEFAULTS : COLUMN_CONTAINER_DEFAULTS,
    fields: [
      defineField({
        name: 'layoutType',
        type: 'string',
        options: {list: ['flex', 'grid']},
      }),
      defineField({
        name: 'contentWidth',
        type: 'string',
        options: {list: ['boxed', 'full']},
      }),
      responsiveSize('width', 'Width', ['px', '%', 'vw']),
      responsiveSize('minHeight', 'Min Height', ['px', 'vh']),
      defineField({
        name: 'gridColumns',
        type: 'object',
        fields: DEVICES.map((device) => defineField({name: device, type: 'number'})),
      }),
      responsiveString('direction', 'Direction', ['row', 'column', 'row-reverse', 'column-reverse']),
      responsiveString('justifyContent', 'Justify Content', [
        ...FLEX_POSITIONS,
        'space-between',
        'space-around',
        'space-evenly',
      ]),
      responsiveString('alignItems', 'Align Items', [...FLEX_POSITIONS, 'stretch']),
      responsiveString('justifyItems', 'Justify Items', [...FLEX_POSITIONS, 'stretch']),
      defineField({
        name: 'gap',
        type: 'object',
        fields: [
          defineField({name: 'linked', type: 'boolean'}),
          ...DEVICES.map((device) =>
            defineField({
              name: device,
              type: 'object',
              fields: [
                defineField({name: 'column', type: 'number'}),
                defineField({name: 'row', type: 'number'}),
                defineField({name: 'unit', type: 'string', options: {list: ['px', 'em', 'rem', '%']}}),
              ],
            }),
          ),
        ],
      }),
      responsiveString('wrap', 'Wrap', ['nowrap', 'wrap']),
      // Additional Options, as in Elementor.
      defineField({name: 'overflow', type: 'string', options: {list: ['hidden', 'auto']}}),
      defineField({
        name: 'htmlTag',
        type: 'string',
        options: {list: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav']},
      }),
    ],
  })
}
