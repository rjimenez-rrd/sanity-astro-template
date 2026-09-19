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
  size?: {
    width?: string | null; widthTablet?: string | null; widthMobile?: string | null
    align?: string | null; alignTablet?: string | null; alignMobile?: string | null
  } | null
  border?: {width?: string | null; style?: string | null; color?: string | null} | null
  borderRadius?: {topLeft?: string | null; topRight?: string | null; bottomRight?: string | null; bottomLeft?: string | null} | null
  background?: {color?: string | null; image?: {asset?: {url?: string | null} | null} | null; size?: string | null; overlay?: string | null} | null
  typography?: {textAlign?: string | null; fontSize?: string | null; textColor?: string | null} | null
  effects?: {shadow?: string | null; opacity?: number | null; overflow?: string | null} | null
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.1)',
}

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

const ALIGN_SELF: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
}

type StyleMap = Record<string, string | number | undefined>

export function buildStyles(bs: BlockStyles | undefined | null): StyleMap {
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
    const width = (raw?: string | null) => {
      const v = raw?.trim()
      return v && CSS_SIZE.test(v) ? v : undefined
    }
    const base = width(bs.size.width)
    const tablet = width(bs.size.widthTablet)
    const mobile = width(bs.size.widthMobile)
    if (base) styles['width'] = base
    if (tablet) styles['--w-tablet'] = tablet
    if (mobile) styles['--w-mobile'] = mobile
    if (base || tablet || mobile) styles['max-width'] = '100%'

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
    const {topLeft, topRight, bottomRight, bottomLeft} = bs.borderRadius
    styles['border-radius'] = `${topLeft || '0'} ${topRight || '0'} ${bottomRight || '0'} ${bottomLeft || '0'}`
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
    if (bs.typography.textAlign) styles['text-align'] = bs.typography.textAlign
    if (bs.typography.fontSize) styles['font-size'] = `${bs.typography.fontSize}px`
    if (bs.typography.textColor) styles['color'] = bs.typography.textColor
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
export function elementStyle(bs: BlockStyles | undefined | null): {
  style: string | undefined
  overlay: boolean
} {
  const styles = buildStyles(bs)
  const overlay = Boolean(bs?.background?.overlay && bs?.background?.image?.asset?.url)
  if (overlay) styles['--pb-overlay'] = bs!.background!.overlay!
  return {style: toStyleString(styles), overlay}
}
