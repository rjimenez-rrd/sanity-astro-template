import {defineField} from 'sanity'
import {StyleInput} from '../../components/tabs/style/StyleInput'
import {BareField} from '../../components/controls/BareField'
import {StyleEffectsInput} from '../../components/tabs/style/StyleEffectsInput'

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

/** Keep in step with the frontend's lib/shapeDividers.ts, which draws each one. */
export const SHAPE_TYPES = [
  'mountains', 'zigzag', 'pyramids', 'triangle', 'triangle-asymmetrical', 'tilt', 'opacity-tilt',
  'curve', 'curve-asymmetrical', 'wave', 'waves', 'arrow', 'book',
]

/** Background Video: a file or a link, as in Elementor (Normal state only). */
const videoField = defineField({
  name: 'video',
  type: 'object',
  options: flat,
  fields: [
    defineField({name: 'url', title: 'Video Link', type: 'string'}),
    defineField({name: 'file', title: 'Video File', type: 'file', options: {accept: 'video/*'}}),
    defineField({name: 'start', title: 'Start Time', type: 'number'}),
    defineField({name: 'end', title: 'End Time', type: 'number'}),
    defineField({name: 'playOnce', title: 'Play Once', type: 'boolean'}),
    defineField({name: 'playOnMobile', title: 'Play On Mobile', type: 'boolean'}),
    defineField({name: 'fallback', title: 'Background Fallback', type: 'image'}),
  ],
})

/** Background Slideshow: images that cross-fade or slide (Normal state only). */
const slideshowField = defineField({
  name: 'slideshow',
  type: 'object',
  options: flat,
  fields: [
    defineField({name: 'images', title: 'Images', type: 'array', of: [{type: 'image'}]}),
    defineField({name: 'loop', title: 'Infinite Loop', type: 'boolean'}),
    defineField({name: 'duration', title: 'Duration (ms)', type: 'number'}),
    defineField({name: 'transition', type: 'string', options: {list: ['fade', 'slide_right', 'slide_left', 'slide_up', 'slide_down']}}),
    defineField({name: 'transitionDuration', title: 'Transition Duration (ms)', type: 'number'}),
    defineField({name: 'size', type: 'string', options: {list: ['cover', 'contain', 'auto']}}),
    defineField({name: 'position', type: 'string', options: {list: BG_POSITIONS}}),
    defineField({name: 'kenBurns', title: 'Ken Burns Effect', type: 'boolean'}),
    defineField({name: 'kenBurnsDirection', type: 'string', options: {list: ['in', 'out']}}),
  ],
})

function backgroundState(
  name: string,
  extra: {opacity?: boolean; transition?: boolean; effects?: boolean; media?: boolean},
) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: [
      defineField({
        name: 'type',
        type: 'string',
        options: {list: ['classic', 'gradient', ...(extra.media ? ['video', 'slideshow'] : [])]},
      }),
      ...(extra.media ? [videoField, slideshowField] : []),
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

/** Shape Divider: a shape along the top or bottom edge, as in Elementor. */
function shapeState(name: string) {
  return defineField({
    name,
    type: 'object',
    options: flat,
    fields: [
      defineField({name: 'type', type: 'string', options: {list: SHAPE_TYPES}}),
      defineField({name: 'color', type: 'string'}),
      responsiveNumber('width'),
      responsiveNumber('height'),
      defineField({name: 'flip', type: 'boolean'}),
      defineField({name: 'invert', type: 'boolean'}),
      defineField({name: 'front', title: 'Bring to Front', type: 'boolean'}),
    ],
  })
}

/** Style tab: Background, Background Overlay and Border, each with Normal / Hover. */
/**
 * `hideBorder`: leave out the Border section, for a block whose border lives
 * in its Block Styles instead (the Image block: see styleEffectsField's keepBorder).
 */
/**
 * `sectionFeatures`: containers and columns also get Background Video and
 * Slideshow, and Shape Dividers — they need a section's own markup (a media
 * layer and edge shapes), which blocks don't render.
 */
export function styleField({
  hideBorder = false,
  sectionFeatures = false,
}: {hideBorder?: boolean; sectionFeatures?: boolean} = {}) {
  return defineField({
    name: 'design',
    title: 'Style',
    type: 'object',
    group: 'style',
    options: {...flat, hideBorder, sectionFeatures} as typeof flat,
    // No "Style" heading: the Style tab already says it.
    components: {input: StyleInput, field: BareField},
    fields: [
      defineField({
        name: 'background',
        type: 'object',
        options: flat,
        fields: [
          backgroundState('normal', {media: sectionFeatures}),
          backgroundState('hover', {transition: true}),
        ],
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
      ...(sectionFeatures
        ? [
            defineField({
              name: 'shapeDivider',
              type: 'object',
              options: flat,
              fields: [shapeState('top'), shapeState('bottom')],
            }),
          ]
        : []),
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
