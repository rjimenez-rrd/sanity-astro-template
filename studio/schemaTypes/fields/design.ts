import {defineField} from 'sanity'
import {ContainerDesignInput} from '../../components/container/ContainerDesignInput'

/*
 * Data for the Elementor-style Style tab. One custom input renders all of it;
 * these definitions exist for storage, validation and typegen. Intermediate
 * objects are not collapsible so the image uploader can be embedded by path.
 */

const DEVICES = ['desktop', 'tablet', 'mobile'] as const

export const BG_POSITIONS = [
  'center center',
  'center left',
  'center right',
  'top center',
  'top left',
  'top right',
  'bottom center',
  'bottom left',
  'bottom right',
]
export const BG_REPEATS = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y']
export const BG_SIZES = ['auto', 'cover', 'contain']
export const BG_ATTACHMENTS = ['scroll', 'fixed']
export const IMAGE_RESOLUTIONS = ['full', 'large', 'medium_large', 'medium', 'thumbnail']
export const BORDER_TYPES = ['none', 'solid', 'double', 'dotted', 'dashed', 'groove']
export const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge',
  'color-burn', 'hard-light', 'soft-light',
  'saturation', 'color', 'difference', 'exclusion', 'hue', 'luminosity',
]

const flat = {collapsible: false}

function responsiveString(name: string, values: string[]) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: DEVICES.map((device) => defineField({name: device, type: 'string', options: {list: values}})),
  })
}

function responsiveNumber(name: string) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: DEVICES.map((device) => defineField({name: device, type: 'number'})),
  })
}

function responsiveSides(name: string) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: [
      defineField({name: 'linked', type: 'boolean'}),
      ...DEVICES.map((device) =>
        defineField({
          name: device,
          type: 'object',
          options: flat,
          fields: [
            ...['top', 'right', 'bottom', 'left'].map((side) => defineField({name: side, type: 'number'})),
            defineField({name: 'unit', type: 'string', options: {list: ['px', '%', 'em', 'rem']}}),
          ],
        }),
      ),
    ],
  })
}

function backgroundState(
  name: string,
  extra: {opacity?: boolean; transition?: boolean; effects?: boolean},
) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: [
      defineField({name: 'type', type: 'string', options: {list: ['classic', 'gradient']}}),
      defineField({name: 'color', type: 'string'}),
      defineField({name: 'image', title: 'Image', type: 'image'}),
      // Optional per-device images; empty falls back to the next larger size.
      defineField({name: 'imageTablet', title: 'Image (tablet)', type: 'image'}),
      defineField({name: 'imageMobile', title: 'Image (mobile)', type: 'image'}),
      defineField({name: 'imageResolution', type: 'string', options: {list: IMAGE_RESOLUTIONS}}),
      responsiveString('position', BG_POSITIONS),
      defineField({name: 'attachment', type: 'string', options: {list: BG_ATTACHMENTS}}),
      responsiveString('repeat', BG_REPEATS),
      responsiveString('size', BG_SIZES),
      defineField({
        name: 'gradient',
        type: 'object',
        options: flat,
        fields: [
          defineField({name: 'color', type: 'string'}),
          responsiveNumber('location'),
          defineField({name: 'secondColor', type: 'string'}),
          responsiveNumber('secondLocation'),
          defineField({name: 'gradientType', type: 'string', options: {list: ['linear', 'radial']}}),
          responsiveNumber('angle'),
          defineField({name: 'position', type: 'string', options: {list: BG_POSITIONS}}),
        ],
      }),
      ...(extra.opacity ? [responsiveNumber('opacity')] : []),
      ...(extra.effects
        ? [
            defineField({
              name: 'filters',
              type: 'object',
              options: flat,
              fields: ['blur', 'brightness', 'contrast', 'saturate', 'hue'].map((f) =>
                defineField({name: f, type: 'number'}),
              ),
            }),
            defineField({name: 'blendMode', type: 'string', options: {list: BLEND_MODES}}),
          ]
        : []),
      ...(extra.transition ? [defineField({name: 'transition', type: 'number'})] : []),
    ],
  })
}

function borderState(name: string, extra: {transition?: boolean}) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: [
      defineField({name: 'type', type: 'string', options: {list: BORDER_TYPES}}),
      responsiveSides('width'),
      defineField({name: 'color', type: 'string'}),
      responsiveSides('radius'),
      defineField({
        name: 'shadow',
        type: 'object',
        options: flat,
        fields: [
          defineField({name: 'color', type: 'string'}),
          defineField({name: 'horizontal', type: 'number'}),
          defineField({name: 'vertical', type: 'number'}),
          defineField({name: 'blur', type: 'number'}),
          defineField({name: 'spread', type: 'number'}),
          defineField({name: 'position', type: 'string', options: {list: ['outline', 'inset']}}),
        ],
      }),
      ...(extra.transition ? [defineField({name: 'transition', type: 'number'})] : []),
    ],
  })
}

/** Style tab: Background, Background Overlay and Border, each with Normal / Hover. */
export function designField() {
  return defineField({
    name: 'design',
    title: 'Style',
    type: 'object',
    group: 'style',
    options: flat,
    components: {input: ContainerDesignInput},
    fields: [
      defineField({
        name: 'background',
        type: 'object',
        options: flat,
        fields: [backgroundState('normal', {}), backgroundState('hover', {transition: true})],
      }),
      defineField({
        name: 'overlay',
        type: 'object',
        options: flat,
        fields: [
          backgroundState('normal', {opacity: true, effects: true}),
          backgroundState('hover', {opacity: true, effects: true, transition: true}),
        ],
      }),
      defineField({
        name: 'border',
        type: 'object',
        options: flat,
        fields: [borderState('normal', {}), borderState('hover', {transition: true})],
      }),
    ],
  })
}
