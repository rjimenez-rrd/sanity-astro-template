import {defineField} from 'sanity'
import {BareField} from '../../components/inputs/BareField'
import {OrderInput} from '../../components/inputs/OrderInput'
import {AlignSelfInput} from '../../components/inputs/AlignSelfInput'
import {FlexSizeInput} from '../../components/inputs/FlexSizeInput'
import {CogIcon, ColorWheelIcon, EyeOpenIcon, ThLargeIcon} from '@sanity/icons'
import {LayoutInput, type ContainerVariant} from '../../components/container/LayoutInput'
import {StyleEffectsInput} from '../../components/container/StyleEffectsInput'
import {spacingField, customCssField} from '../objects/block-styles'
import {motionField} from './motion'
import {
  COLUMN_CONTAINER_DEFAULTS,
  ROW_CONTAINER_DEFAULTS,
} from '../../components/container/defaults'

/**
 * Elementor-style editing for containers: the same four tabs and the same
 * fields on page rows and on the columns inside them.
 */
export const CONTAINER_GROUPS = [
  {name: 'layout', title: 'Layout', icon: ThLargeIcon, default: true},
  {name: 'style', title: 'Style', icon: ColorWheelIcon},
  {name: 'advanced', title: 'Advanced', icon: CogIcon},
  {name: 'visibility', title: 'Visibility', icon: EyeOpenIcon},
]

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

/**
 * Below the Style panel: typography and effects, plus any background or
 * border saved before the Style panel existed (so those stay editable).
 */
/** Nothing set, however deep: empty strings, objects of empties, empty lists. */
function isEmptyDeep(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.every(isEmptyDeep)
  if (typeof value === 'object') {
    return Object.entries(value as object).every(([k, v]) => k.startsWith('_') || isEmptyDeep(v))
  }
  return false
}

export function styleEffectsField({
  keepBorder = false,
  legacyOnly = false,
}: {
  keepBorder?: boolean
  /**
   * For containers and columns: their Style tab matches Elementor's
   * (Background, Background Overlay, Border), so this panel is only shown
   * while it still holds values saved before — they keep working, and can be
   * seen and cleared. Blocks (Image, Video) keep it as their styles.
   */
  legacyOnly?: boolean
} = {}) {
  return defineField({
    name: 'blockStyles',
    title: 'Typography & Effects',
    type: 'blockStyles',
    group: 'style',
    ...(legacyOnly && {hidden: ({value}: {value?: unknown}) => isEmptyDeep(value)}),
    // keepBorder: Border and Border Radius stay here, always shown, for a
    // block that uses them instead of the Style panel's (styleField's
    // hideBorder). The Image block does, so its saved corners keep working.
    ...(keepBorder && {options: {keepBorder} as never}),
    components: {input: StyleEffectsInput},
  })
}

/** A CSS length: a number with px, %, em, rem, vw or vh (e.g. 20px, -10%). */
const CSS_LENGTH = /^-?\d+(\.\d+)?(px|%|em|rem|vw|vh)$/

/**
 * Advanced tab, in Elementor's order: spacing, how the element sits among its
 * siblings (Align Self, Order, Size, Position, Z-Index), hooks for custom
 * CSS, then Motion Effects, Transform, Attributes and Custom CSS.
 */
export function advancedField() {
  return defineField({
    name: 'advanced',
    title: 'Advanced',
    type: 'object',
    group: 'advanced',
    options: {collapsible: false},
    // No "Advanced" heading: the Advanced tab already says it.
    components: {field: BareField},
    fields: [
      spacingField('margin', 'Margin'),
      spacingField('padding', 'Padding'),
      defineField({
        name: 'alignSelf',
        title: 'Align Self',
        type: 'object',
        // Draws its own label and device switcher.
        components: {input: AlignSelfInput, field: BareField},
        fields: DEVICES.map((d) => defineField({name: d, type: 'string'})),
      }),
      defineField({
        name: 'order',
        title: 'Order',
        type: 'object',
        // Start / End / Custom per device, as in Elementor. Stored as numbers:
        // Start is -99, End is 99, Custom anything between.
        // The control draws its own "Order" label and device switcher, so the
        // default field wrapper would print a second one above it.
        components: {input: OrderInput, field: BareField},
        fields: [
          defineField({name: 'desktop', title: 'Desktop', type: 'number'}),
          defineField({name: 'tablet', title: 'Tablet', type: 'number'}),
          defineField({name: 'mobile', title: 'Mobile', type: 'number'}),
        ],
      }),
      defineField({
        name: 'size',
        title: 'Size',
        type: 'object',
        // None / Grow / Shrink / Custom per device; draws its own label.
        components: {input: FlexSizeInput, field: BareField},
        fields: DEVICES.map((d) =>
          defineField({
            name: d,
            type: 'object',
            fields: [
              defineField({name: 'mode', type: 'string'}),
              defineField({name: 'grow', type: 'number'}),
              defineField({name: 'shrink', type: 'number'}),
            ],
          }),
        ),
      }),
      defineField({
        name: 'position',
        title: 'Position',
        type: 'object',
        options: {collapsible: true, collapsed: true},
        description:
          'Absolute: placed against the nearest positioned parent (a column or container). Fixed: stays put on screen while scrolling.',
        fields: [
          defineField({
            name: 'type',
            title: 'Position',
            type: 'string',
            options: {
              list: [
                {title: 'Default', value: ''},
                {title: 'Absolute', value: 'absolute'},
                {title: 'Fixed', value: 'fixed'},
              ],
              layout: 'radio',
              direction: 'horizontal',
            },
          }),
          ...(
            [
              ['horizontal', 'Horizontal Orientation', ['left', 'right'], 'offsetX', 'Offset'],
              ['vertical', 'Vertical Orientation', ['top', 'bottom'], 'offsetY', 'Offset'],
            ] as const
          ).flatMap(([name, title, sides, offset, offsetTitle]) => [
            defineField({
              name,
              title,
              type: 'string',
              initialValue: sides[0],
              options: {
                list: sides.map((side) => ({title: side[0].toUpperCase() + side.slice(1), value: side})),
                layout: 'radio',
                direction: 'horizontal',
              },
              hidden: ({parent}) => !parent?.type,
            }),
            defineField({
              name: offset,
              title: offsetTitle,
              type: 'string',
              description: 'e.g. 0, 20px, 10%.',
              validation: (rule) =>
                rule.custom((v?: string) => !v || v === '0' || CSS_LENGTH.test(v) || 'A number with px, %, em, rem, vw or vh'),
              hidden: ({parent}) => !parent?.type,
            }),
          ]),
        ],
      }),
      defineField({
        name: 'zIndex',
        title: 'Z-Index',
        type: 'number',
        validation: (rule) => rule.integer(),
      }),
      defineField({
        name: 'cssId',
        title: 'CSS ID',
        type: 'string',
        description: 'Letters, numbers, hyphens and underscores. Must start with a letter.',
        validation: (rule) =>
          rule.regex(/^[A-Za-z][A-Za-z0-9_-]*$/, {name: 'CSS identifier'}).warning(),
      }),
      defineField({
        name: 'cssClasses',
        title: 'CSS Classes',
        type: 'string',
        description: 'Space-separated, without the dot. For hooking in the page’s own styles.',
      }),
      motionField(),
      defineField({
        name: 'transform',
        title: 'Transform',
        type: 'object',
        options: {collapsible: true, collapsed: true},
        fields: [
          defineField({name: 'rotate', title: 'Rotate (deg)', type: 'number'}),
          defineField({
            name: 'scale',
            title: 'Scale',
            type: 'number',
            description: '1 is normal size, 1.1 is 10% bigger.',
            validation: (rule) => rule.min(0).max(10),
          }),
          ...(['translateX', 'translateY'] as const).map((name) =>
            defineField({
              name,
              title: name === 'translateX' ? 'Offset X' : 'Offset Y',
              type: 'string',
              description: 'Moves it without affecting the layout, e.g. 20px, -10%.',
              validation: (rule) =>
                rule.custom((v?: string) => !v || v === '0' || CSS_LENGTH.test(v) || 'A number with px, %, em, rem, vw or vh'),
            }),
          ),
          defineField({name: 'skewX', title: 'Skew X (deg)', type: 'number'}),
          defineField({name: 'skewY', title: 'Skew Y (deg)', type: 'number'}),
        ],
      }),
      defineField({
        name: 'attributes',
        title: 'Attributes',
        type: 'text',
        rows: 3,
        description:
          'One per line as key|value, e.g. data-section|intro or aria-label|Our services. Event handlers (on…), style and id aren’t allowed.',
      }),
      customCssField(),
    ],
  })
}

/** Visibility tab: hide per device, at Elementor's breakpoints. */
export function visibilityField() {
  const toggle = (name: string, title: string, description: string) =>
    defineField({name, title, type: 'boolean', description, initialValue: false})

  return defineField({
    name: 'visibility',
    title: 'Visibility',
    type: 'object',
    group: 'visibility',
    components: {field: BareField},
    fields: [
      toggle('hideOnDesktop', 'Hide On Desktop', 'Screens 1025px and wider.'),
      toggle('hideOnTablet', 'Hide On Tablet', 'Screens 768px to 1024px.'),
      toggle('hideOnMobile', 'Hide On Mobile', 'Screens 767px and narrower.'),
    ],
  })
}
