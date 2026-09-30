import {defineField} from 'sanity'
import {DEVICES, responsiveSize, responsiveString} from './responsive'
import {BareField} from '../../components/controls/BareField'
import {LayoutInput, type ContainerVariant} from '../../components/tabs/layout/LayoutInput'
import {
  COLUMN_CONTAINER_DEFAULTS,
  ROW_CONTAINER_DEFAULTS,
} from '../../components/tabs/layout/layoutDefaults'

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
      responsiveSize('width', ['px', '%', 'vw'], 'Width'),
      responsiveSize('minHeight', ['px', 'vh'], 'Min Height'),
      defineField({
        name: 'gridColumns',
        type: 'object',
        fields: DEVICES.map((device) => defineField({name: device, type: 'number'})),
      }),
      responsiveString('direction', ['row', 'column', 'row-reverse', 'column-reverse'], 'Direction'),
      responsiveString('justifyContent', [
        ...FLEX_POSITIONS,
        'space-between',
        'space-around',
        'space-evenly',
      ], 'Justify Content'),
      responsiveString('alignItems', [...FLEX_POSITIONS, 'stretch'], 'Align Items'),
      responsiveString('justifyItems', [...FLEX_POSITIONS, 'stretch'], 'Justify Items'),
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
      responsiveString('wrap', ['nowrap', 'wrap'], 'Wrap'),
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
