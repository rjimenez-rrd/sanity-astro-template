import {defineField} from 'sanity'
import {BareField} from '../../components/controls/BareField'
import {AlignSelfInput} from '../../components/tabs/advanced/AlignSelfInput'
import {FlexSizeInput} from '../../components/tabs/advanced/FlexSizeInput'
import {OrderInput} from '../../components/tabs/advanced/OrderInput'
import {spacingField, customCssField} from '../objects/block-styles'
import {motionField} from './motion'

const DEVICES = ['desktop', 'tablet', 'mobile'] as const

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
