import {defineType, defineField} from 'sanity'
import {SPACING_OPTIONS} from '../shared/constants'
import {motionField} from '../shared/motion'
import {BlockStylesPreview} from '../../components/BlockStylesPreview'
import {SpacingInput} from '../../components/SpacingInput'
import {BorderRadiusInput} from '../../components/BorderRadiusInput'
import {BorderStyleInput} from '../../components/BorderStyleInput'
import {TypographyInput} from '../../components/TypographyInput'
import {EffectsInput} from '../../components/EffectsInput'
import {BackgroundInput} from '../../components/BackgroundInput'

const spacingList = SPACING_OPTIONS.map((opt) => ({
  title: opt.title,
  value: opt.value,
}))

function directionField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'string',
    options: {list: spacingList, layout: 'dropdown'},
  })
}

/**
 * Responsive four-side spacing (base = mobile, Md = tablet, Lg = desktop).
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
      directionField('topMd', 'Top (md)'),
      directionField('rightMd', 'Right (md)'),
      directionField('bottomMd', 'Bottom (md)'),
      directionField('leftMd', 'Left (md)'),
      directionField('topLg', 'Top (lg)'),
      directionField('rightLg', 'Right (lg)'),
      directionField('bottomLg', 'Bottom (lg)'),
      directionField('leftLg', 'Left (lg)'),
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
        defineField({name: 'textAlign', title: 'Align', type: 'string'}),
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
