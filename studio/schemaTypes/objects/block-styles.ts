import {defineType, defineField} from 'sanity'
import {motionField} from '../fields/motion'
import {BlockStylesPreview} from '../../components/previews/BlockStylesPreview'
import {SpacingInput} from '../../components/inputs/SpacingInput'
import {SizeInput} from '../../components/inputs/SizeInput'
import {BorderRadiusInput} from '../../components/inputs/BorderRadiusInput'
import {BorderStyleInput} from '../../components/inputs/BorderStyleInput'
import {TypographyInput} from '../../components/inputs/TypographyInput'
import {EffectsInput} from '../../components/inputs/EffectsInput'
import {BackgroundInput} from '../../components/inputs/BackgroundInput'

const ALIGN_LIST = [
  {title: 'Start', value: 'start'},
  {title: 'Center', value: 'center'},
  {title: 'End', value: 'end'},
]

function widthField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'string',
    description: 'A number with a unit, e.g. 320px, 50%, 20rem. Empty fills the container.',
    validation: (rule) =>
      rule
        .regex(/^\d+(\.\d+)?(px|%|rem|em|vw)$/, {name: 'CSS width'})
        .warning('Use a number with a unit, like 320px or 50%.'),
  })
}

function alignField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'string',
    description: 'Where the block sits when it is narrower than the container.',
    options: {list: ALIGN_LIST},
  })
}

/**
 * One side of a spacing box. SpacingInput writes `${number}${unit}`, negatives
 * included — free-form rather than a preset list, so it stays a plain string.
 */
function directionField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'string',
  })
}

/**
 * Responsive four-side spacing, desktop-first to match the container Layout tab:
 * the unsuffixed fields are the base that applies everywhere, Tablet overrides
 * at ≤1024px and Mobile at ≤767px.
 * Shared with the container Advanced tab so both render through SpacingInput.
 */
export function spacingField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    components: {input: SpacingInput},
    fields: [
      directionField('top', 'Top'),
      directionField('right', 'Right'),
      directionField('bottom', 'Bottom'),
      directionField('left', 'Left'),
      directionField('topTablet', 'Top (tablet)'),
      directionField('rightTablet', 'Right (tablet)'),
      directionField('bottomTablet', 'Bottom (tablet)'),
      directionField('leftTablet', 'Left (tablet)'),
      directionField('topMobile', 'Top (mobile)'),
      directionField('rightMobile', 'Right (mobile)'),
      directionField('bottomMobile', 'Bottom (mobile)'),
      directionField('leftMobile', 'Left (mobile)'),
      // Editing preference, not a style: when on, the four sides move together.
      // SpacingInput treats unset as linked, so only an explicit false unlinks.
      defineField({name: 'linked', title: 'Link sides', type: 'boolean'}),
    ],
  })
}

export const blockStylesType = defineType({
  name: 'blockStyles',
  title: 'Block Styles',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  components: {
    input: BlockStylesPreview,
  },
  fields: [
    spacingField('padding', 'Padding'),
    spacingField('margin', 'Margin'),
    defineField({
      name: 'size',
      title: 'Size & Alignment',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      components: {input: SizeInput},
      // Desktop-first like the spacing fields: unsuffixed is the base, Tablet
      // overrides at <=1024px and Mobile at <=767px.
      fields: [
        widthField('width', 'Width'),
        widthField('widthTablet', 'Width (tablet)'),
        widthField('widthMobile', 'Width (mobile)'),
        alignField('align', 'Align'),
        alignField('alignTablet', 'Align (tablet)'),
        alignField('alignMobile', 'Align (mobile)'),
      ],
    }),
    defineField({
      name: 'border',
      title: 'Border',
      type: 'object',
      components: {input: BorderStyleInput},
      fields: [
        defineField({name: 'width', title: 'Width', type: 'string'}),
        defineField({name: 'style', title: 'Style', type: 'string'}),
        defineField({name: 'color', title: 'Color', type: 'string'}),
      ],
    }),
    defineField({
      name: 'borderRadius',
      title: 'Border Radius',
      type: 'object',
      components: {input: BorderRadiusInput},
      fields: [
        defineField({name: 'topLeft', title: 'Top Left', type: 'string'}),
        defineField({name: 'topRight', title: 'Top Right', type: 'string'}),
        defineField({name: 'bottomRight', title: 'Bottom Right', type: 'string'}),
        defineField({name: 'bottomLeft', title: 'Bottom Left', type: 'string'}),
      ],
    }),
    defineField({
      name: 'background',
      title: 'Background',
      type: 'object',
      components: {input: BackgroundInput},
      fields: [
        defineField({
          name: 'color',
          title: 'Color',
          type: 'string',
          hidden: true,
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {hotspot: true},
        }),
        defineField({
          name: 'size',
          title: 'Size',
          type: 'string',
          hidden: ({parent}) => !parent?.image,
          options: {
            list: [
              {title: 'Cover', value: 'cover'},
              {title: 'Contain', value: 'contain'},
              {title: 'Auto', value: 'auto'},
            ],
          },
        }),
        defineField({
          name: 'overlay',
          title: 'Overlay',
          type: 'string',
          description: 'e.g., rgba(0,0,0,0.5)',
          hidden: ({parent}) => !parent?.image,
        }),
      ],
    }),
    defineField({
      name: 'typography',
      title: 'Typography',
      type: 'object',
      components: {input: TypographyInput},
      fields: [
        // Desktop-first like spacing: unsuffixed is the base, Tablet overrides
        // at <=1024px and Mobile at <=767px.
        defineField({name: 'textAlign', title: 'Align', type: 'string'}),
        defineField({name: 'textAlignTablet', title: 'Align (tablet)', type: 'string'}),
        defineField({name: 'textAlignMobile', title: 'Align (mobile)', type: 'string'}),
        defineField({name: 'fontSize', title: 'Size', type: 'string'}),
        defineField({name: 'textColor', title: 'Color', type: 'string'}),
      ],
    }),
    defineField({
      name: 'effects',
      title: 'Effects',
      type: 'object',
      components: {input: EffectsInput},
      fields: [
        defineField({name: 'shadow', title: 'Shadow', type: 'string'}),
        defineField({name: 'opacity', title: 'Opacity', type: 'number'}),
        defineField({name: 'overflow', title: 'Overflow', type: 'string'}),
      ],
    }),
    motionField(),
  ],
})
