/**
 * The Style tab's option lists: one source for both the schema
 * (schemaTypes/tabs/style.ts, which stores the values) and the Style panel's
 * dropdowns (which show the titles). Values are stored data — don't rename.
 */

/** [value, title] */
export type Option = [string, string]

/** Just the values, for a schema field's options.list. */
export const values = (options: Option[]) => options.map(([value]) => value)

export const BG_POSITIONS: Option[] = [
  ['center center', 'Center Center'],
  ['center left', 'Center Left'],
  ['center right', 'Center Right'],
  ['top center', 'Top Center'],
  ['top left', 'Top Left'],
  ['top right', 'Top Right'],
  ['bottom center', 'Bottom Center'],
  ['bottom left', 'Bottom Left'],
  ['bottom right', 'Bottom Right'],
]

export const BG_REPEATS: Option[] = [
  ['no-repeat', 'No-repeat'],
  ['repeat', 'Repeat'],
  ['repeat-x', 'Repeat-x'],
  ['repeat-y', 'Repeat-y'],
]

export const BG_SIZES: Option[] = [
  ['auto', 'Auto'],
  ['cover', 'Cover'],
  ['contain', 'Contain'],
]

export const BG_ATTACHMENTS: Option[] = [
  ['scroll', 'Scroll'],
  ['fixed', 'Fixed'],
]

export const IMAGE_RESOLUTIONS: Option[] = [
  ['full', 'Full'],
  ['large', 'Large - 1024'],
  ['medium_large', 'Medium Large - 768'],
  ['medium', 'Medium - 300'],
  ['thumbnail', 'Thumbnail - 150'],
]

export const GRADIENT_TYPES: Option[] = [
  ['linear', 'Linear'],
  ['radial', 'Radial'],
]

/** 'normal' is a stored value, but the panel shows it as the empty "Normal" choice. */
export const BLEND_MODES: Option[] = [
  ['normal', 'Normal'],
  ['multiply', 'Multiply'],
  ['screen', 'Screen'],
  ['overlay', 'Overlay'],
  ['darken', 'Darken'],
  ['lighten', 'Lighten'],
  ['color-dodge', 'Color Dodge'],
  ['color-burn', 'Color Burn'],
  ['hard-light', 'Hard Light'],
  ['soft-light', 'Soft Light'],
  ['saturation', 'Saturation'],
  ['color', 'Color'],
  ['difference', 'Difference'],
  ['exclusion', 'Exclusion'],
  ['hue', 'Hue'],
  ['luminosity', 'Luminosity'],
]

export const SLIDESHOW_TRANSITIONS: Option[] = [
  ['fade', 'Fade'],
  ['slide_right', 'Slide Right'],
  ['slide_left', 'Slide Left'],
  ['slide_up', 'Slide Up'],
  ['slide_down', 'Slide Down'],
]

export const KEN_BURNS_DIRECTIONS: Option[] = [
  ['in', 'In'],
  ['out', 'Out'],
]

export const BORDER_TYPES: Option[] = [
  ['none', 'None'],
  ['solid', 'Solid'],
  ['double', 'Double'],
  ['dotted', 'Dotted'],
  ['dashed', 'Dashed'],
  ['groove', 'Groove'],
]

export const BORDER_UNITS = ['px', '%', 'em', 'rem']

export const SHADOW_POSITIONS: Option[] = [
  ['outline', 'Outline'],
  ['inset', 'Inset'],
]

/** Shape Divider shapes. Keep in step with the frontend's lib/shapeDividers.ts, which draws each one. */
export const SHAPE_TYPES: Option[] = [
  ['mountains', 'Mountains'],
  ['zigzag', 'Zigzag'],
  ['pyramids', 'Pyramids'],
  ['triangle', 'Triangle'],
  ['triangle-asymmetrical', 'Triangle Asymmetrical'],
  ['tilt', 'Tilt'],
  ['opacity-tilt', 'Tilt Opacity'],
  ['curve', 'Curve'],
  ['curve-asymmetrical', 'Curve Asymmetrical'],
  ['wave', 'Wave'],
  ['waves', 'Waves'],
  ['arrow', 'Arrow'],
  ['book', 'Book'],
]
