import {defineField, type FieldProps} from 'sanity'
import {CogIcon, ColorWheelIcon, EyeOpenIcon, ThLargeIcon} from '@sanity/icons'
import {ContainerLayoutInput, type ContainerVariant} from '../../components/container/ContainerLayoutInput'
import {ContainerStyleInput} from '../../components/container/ContainerStyleInput'
import {spacingField} from '../objects/block-styles'
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
export function containerField(variant: ContainerVariant) {
  return defineField({
    name: 'container',
    title: 'Container',
    type: 'object',
    group: 'layout',
    options: {variant} as Record<string, unknown>,
    components: {
      input: ContainerLayoutInput,
      // ContainerLayoutInput draws its own collapsible "Container" header, so
      // the default field wrapper would stack a second identical label above it.
      field: (props: FieldProps) => props.children,
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
    ],
  })
}

/**
 * Below the Style panel: typography and effects, plus any background or
 * border saved before the Style panel existed (so those stay editable).
 */
export function styleField() {
  return defineField({
    name: 'blockStyles',
    title: 'Typography & Effects',
    type: 'blockStyles',
    group: 'style',
    components: {input: ContainerStyleInput},
  })
}

/** Advanced tab: spacing, stacking and hooks for custom CSS. */
export function advancedField() {
  return defineField({
    name: 'advanced',
    title: 'Advanced',
    type: 'object',
    group: 'advanced',
    options: {collapsible: false},
    fields: [
      spacingField('margin', 'Margin'),
      spacingField('padding', 'Padding'),
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
    fields: [
      toggle('hideOnDesktop', 'Hide On Desktop', 'Screens 1025px and wider.'),
      toggle('hideOnTablet', 'Hide On Tablet', 'Screens 768px to 1024px.'),
      toggle('hideOnMobile', 'Hide On Mobile', 'Screens 767px and narrower.'),
    ],
  })
}
