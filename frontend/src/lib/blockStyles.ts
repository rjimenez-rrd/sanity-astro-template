import {fontStack} from './fonts'
import {safeColor} from './cssValues'

export interface BlockStyles {
  padding?: {
    top?: string | null; right?: string | null; bottom?: string | null; left?: string | null
    topTablet?: string | null; rightTablet?: string | null; bottomTablet?: string | null; leftTablet?: string | null
    topMobile?: string | null; rightMobile?: string | null; bottomMobile?: string | null; leftMobile?: string | null
  } | null
  margin?: {
    top?: string | null; right?: string | null; bottom?: string | null; left?: string | null
    topTablet?: string | null; rightTablet?: string | null; bottomTablet?: string | null; leftTablet?: string | null
    topMobile?: string | null; rightMobile?: string | null; bottomMobile?: string | null; leftMobile?: string | null
  } | null
  cssId?: string | null
  cssClasses?: string | null
  customCss?: string | null
  size?: {
    width?: string | null; widthTablet?: string | null; widthMobile?: string | null
    height?: string | null; heightTablet?: string | null; heightMobile?: string | null
    align?: string | null; alignTablet?: string | null; alignMobile?: string | null
  } | null
  border?: {width?: string | null; style?: string | null; color?: string | null} | null
  borderRadius?: {topLeft?: string | null; topRight?: string | null; bottomRight?: string | null; bottomLeft?: string | null} | null
  background?: {color?: string | null; image?: {asset?: {url?: string | null} | null} | null; size?: string | null; overlay?: string | null} | null
  typography?: {
    textAlign?: string | null
    textAlignTablet?: string | null
    textAlignMobile?: string | null
    fontSize?: string | null
    fontSizeTablet?: string | null
    fontSizeMobile?: string | null
    textColor?: string | null
    headingFont?: string | null
  } | null
  effects?: {shadow?: string | null; opacity?: number | null; overflow?: string | null} | null
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.1)',
}

/** The Border Radius control's "Round" value (studio BorderRadiusInput). */
const ROUND = '9999px'

/** A corner radius: a bare number plus a unit, or 0. */
const CSS_RADIUS = /^(0|\d+(\.\d+)?(px|%|em|rem))$/

/** Widths come from editors, so only a bare number plus a known unit reaches CSS. */
const CSS_SIZE = /^\d+(\.\d+)?(px|%|rem|em|vw)$/

/**
 * Spacing is free-form editor input, so only a signed number plus a known unit
 * reaches CSS. Negatives are allowed for margins; the browser ignores a negative
 * padding, which is how Elementor behaves too.
 */
const CSS_LENGTH = /^-?\d+(\.\d+)?(px|%|em|rem|vh|vw)$/

const len = (raw?: string | null): string | undefined => {
  const v = raw?.trim()
  return v && CSS_LENGTH.test(v) ? v : undefined
}

const TEXT_ALIGN = new Set(['left', 'center', 'right', 'start', 'end', 'justify'])

const align = (raw?: string | null): string | undefined =>
  raw && TEXT_ALIGN.has(raw.trim()) ? raw.trim() : undefined

const ALIGN_SELF: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
}

type StyleMap = Record<string, string | number | undefined>

/**
 * `radiusVar`: also hand the Border Radius to the element's content as
 * --pb-radius (see below). Blocks only (BlockRenderer): on a container or
 * column it would reach every image block inside and round them all to the
 * container's corners.
 */
export function buildStyles(
  bs: BlockStyles | undefined | null,
  {radiusVar = false}: {radiusVar?: boolean} = {},
): StyleMap {
  if (!bs) return {}

  const styles: StyleMap = {}

  // Padding — the desktop base as real properties, tablet/mobile as custom
  // properties that the max-width media queries in global.css promote below.
  if (bs.padding) {
    styles['padding-top'] = len(bs.padding.top)
    styles['padding-right'] = len(bs.padding.right)
    styles['padding-bottom'] = len(bs.padding.bottom)
    styles['padding-left'] = len(bs.padding.left)
    styles['--pt-tablet'] = len(bs.padding.topTablet)
    styles['--pr-tablet'] = len(bs.padding.rightTablet)
    styles['--pb-tablet'] = len(bs.padding.bottomTablet)
    styles['--pl-tablet'] = len(bs.padding.leftTablet)
    styles['--pt-mobile'] = len(bs.padding.topMobile)
    styles['--pr-mobile'] = len(bs.padding.rightMobile)
    styles['--pb-mobile'] = len(bs.padding.bottomMobile)
    styles['--pl-mobile'] = len(bs.padding.leftMobile)
  }

  // Margin — same pattern
  if (bs.margin) {
    styles['margin-top'] = len(bs.margin.top)
    styles['margin-right'] = len(bs.margin.right)
    styles['margin-bottom'] = len(bs.margin.bottom)
    styles['margin-left'] = len(bs.margin.left)
    styles['--mt-tablet'] = len(bs.margin.topTablet)
    styles['--mr-tablet'] = len(bs.margin.rightTablet)
    styles['--mb-tablet'] = len(bs.margin.bottomTablet)
    styles['--ml-tablet'] = len(bs.margin.leftTablet)
    styles['--mt-mobile'] = len(bs.margin.topMobile)
    styles['--mr-mobile'] = len(bs.margin.rightMobile)
    styles['--mb-mobile'] = len(bs.margin.bottomMobile)
    styles['--ml-mobile'] = len(bs.margin.leftMobile)
  }

  // Size & alignment — a block narrower than its column needs align-self to sit
  // anywhere but the start of it, since the column stretches items by default.
  if (bs.size) {
    // `auto` resets a width a larger device set (BlockRenderer uses it when a
    // button's Full Width applies above but not on this device).
    const width = (raw?: string | null) => {
      const v = raw?.trim()
      return v && (v === 'auto' || CSS_SIZE.test(v)) ? v : undefined
    }
    const base = width(bs.size.width)
    const tablet = width(bs.size.widthTablet)
    const mobile = width(bs.size.widthMobile)
    if (base) styles['width'] = base
    if (tablet) styles['--w-tablet'] = tablet
    if (mobile) styles['--w-mobile'] = mobile
    if (base || tablet || mobile) styles['max-width'] = '100%'

    /**
     * Height is either a length or the token `fill`. A block sits in a column
     * that is `flex-direction: column` with items at `flex: 0 0 auto`, so it
     * keeps its natural height however tall the column grows — `fill` swaps
     * that for `flex: 1 1 auto` so the block takes the leftover space, and the
     * `[data-pb-fill]` rules in global.css push that height down to the image
     * or iframe inside it.
     */
    const height = (raw?: string | null) => {
      const v = raw?.trim()
      if (v === 'fill') return 'fill'
      return v && CSS_SIZE.test(v) ? v : undefined
    }
    const hBase = height(bs.size.height)
    const hTablet = height(bs.size.heightTablet)
    const hMobile = height(bs.size.heightMobile)

    if (hBase === 'fill') {
      styles['flex'] = '1 1 auto'
      styles['min-height'] = '0'
    } else if (hBase) {
      styles['height'] = hBase
    }
    // Promoted by the max-width rules in global.css, like every other override.
    if (hTablet === 'fill') styles['--fill-tablet'] = '1 1 auto'
    else if (hTablet) styles['--h-tablet'] = hTablet
    if (hMobile === 'fill') styles['--fill-mobile'] = '1 1 auto'
    else if (hMobile) styles['--h-mobile'] = hMobile

    const align = (raw?: string | null) => (raw ? ALIGN_SELF[raw] : undefined)
    const alignBase = align(bs.size.align)
    const alignTablet = align(bs.size.alignTablet)
    const alignMobile = align(bs.size.alignMobile)
    if (alignBase) styles['align-self'] = alignBase
    if (alignTablet) styles['--as-tablet'] = alignTablet
    if (alignMobile) styles['--as-mobile'] = alignMobile
  }

  // Border
  if (bs.border) {
    if (bs.border.width) styles['border-width'] = bs.border.width
    if (bs.border.style) styles['border-style'] = bs.border.style
    if (bs.border.color) styles['border-color'] = bs.border.color
  }

  // Border radius
  if (bs.borderRadius) {
    // Editor input goes straight into an inline style, so each corner must be
    // a plain length ("8px", "50%", "0"); anything else is dropped.
    const corner = (c?: string | null) => {
      const v = c?.trim()
      return v && CSS_RADIUS.test(v) ? v : undefined
    }
    const {topLeft, topRight, bottomRight, bottomLeft} = bs.borderRadius
    const corners = [topLeft, topRight, bottomRight, bottomLeft].map(corner)
    // "Round" is 9999px. Next to other rounded corners that would make the
    // browser scale every radius down until they fit, which flattens the
    // pixel ones (4px becomes ~0). Mixed like that, Round draws as 50%: still
    // a full curve, and the others keep their size. All-Round stays 9999px,
    // for a pill or circle.
    const isRound = (c?: string) => c === ROUND
    const mixed = corners.some(isRound) && corners.some((c) => c && !isRound(c) && c !== '0')
    if (corners.some(Boolean)) {
      styles['border-radius'] = corners.map((c) => (mixed && isRound(c) ? '50%' : c || '0')).join(' ')
      // Also handed to the block's content: the wrapper doesn't clip it, so an
      // image would otherwise cover the rounded corners (Image.astro reads it).
      if (radiusVar) styles['--pb-radius'] = styles['border-radius']
    }
  }

  // Background
  if (bs.background) {
    if (bs.background.color) styles['background-color'] = bs.background.color
    if (bs.background.image?.asset?.url) {
      styles['background-image'] = `url(${bs.background.image.asset.url})`
      styles['background-size'] = bs.background.size || 'cover'
      styles['background-position'] = 'center'
    }
  }

  // Typography
  if (bs.typography) {
    styles['text-align'] = align(bs.typography.textAlign)
    styles['--ta-tablet'] = align(bs.typography.textAlignTablet)
    styles['--ta-mobile'] = align(bs.typography.textAlignMobile)

    // Desktop-first like everything else here: the base is a real property,
    // Tablet/Mobile are custom properties the max-width rules in global.css
    // promote below their breakpoint.
    const fontSize = (raw?: string | null) => {
      const v = raw?.trim()
      return v && /^\d+(\.\d+)?$/.test(v) ? `${v}px` : undefined
    }
    const fsBase = fontSize(bs.typography.fontSize)
    if (fsBase) styles['font-size'] = fsBase
    styles['--fs-tablet'] = fontSize(bs.typography.fontSizeTablet)
    styles['--fs-mobile'] = fontSize(bs.typography.fontSizeMobile)

    const color = safeColor(bs.typography.textColor)
    if (color) styles['color'] = color

    // Read by the [data-pb-hfont] rule in global.css; only bundled fonts pass.
    styles['--pb-heading-font'] = fontStack(bs.typography.headingFont)
  }

  // Effects
  if (bs.effects) {
    if (bs.effects.shadow) styles['box-shadow'] = SHADOW_MAP[bs.effects.shadow] || 'none'
    if (typeof bs.effects.opacity === 'number') styles['opacity'] = bs.effects.opacity / 100
    if (bs.effects.overflow) styles['overflow'] = bs.effects.overflow
  }

  return styles
}

/** Serialises the style map into an inline `style` attribute value. */
export function toStyleString(styles: StyleMap): string | undefined {
  const entries = Object.entries(styles).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return undefined
  return entries.map(([k, v]) => `${k}:${v}`).join(';')
}

/** True when the styles would produce anything — otherwise no wrapper is needed. */
export function hasBlockStyles(bs: BlockStyles | undefined | null): boolean {
  return toStyleString(buildStyles(bs)) !== undefined
}

/**
 * Inline style for an element that is its own styled box. A background
 * overlay is drawn by the `[data-pb-overlay]` rule in global.css from the
 * `--pb-overlay` variable, instead of an extra absolutely-positioned div.
 */
export function elementStyle(
  bs: BlockStyles | undefined | null,
  options?: {radiusVar?: boolean},
): {
  style: string | undefined
  overlay: boolean
  /** Typography -> Heading Font is set: mark the element data-pb-hfont (global.css). */
  headingFont: boolean
} {
  const styles = buildStyles(bs, options)
  const overlay = Boolean(bs?.background?.overlay && bs?.background?.image?.asset?.url)
  if (overlay) styles['--pb-overlay'] = bs!.background!.overlay!
  return {style: toStyleString(styles), overlay, headingFont: Boolean(styles['--pb-heading-font'])}
}
