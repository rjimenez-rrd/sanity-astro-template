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
    if (bs.padding.top) styles['padding-top'] = bs.padding.top
    if (bs.padding.right) styles['padding-right'] = bs.padding.right
    if (bs.padding.bottom) styles['padding-bottom'] = bs.padding.bottom
    if (bs.padding.left) styles['padding-left'] = bs.padding.left
    if (bs.padding.topTablet) styles['--pt-tablet'] = bs.padding.topTablet
    if (bs.padding.rightTablet) styles['--pr-tablet'] = bs.padding.rightTablet
    if (bs.padding.bottomTablet) styles['--pb-tablet'] = bs.padding.bottomTablet
    if (bs.padding.leftTablet) styles['--pl-tablet'] = bs.padding.leftTablet
    if (bs.padding.topMobile) styles['--pt-mobile'] = bs.padding.topMobile
    if (bs.padding.rightMobile) styles['--pr-mobile'] = bs.padding.rightMobile
    if (bs.padding.bottomMobile) styles['--pb-mobile'] = bs.padding.bottomMobile
    if (bs.padding.leftMobile) styles['--pl-mobile'] = bs.padding.leftMobile
  }

  // Margin — same pattern
  if (bs.margin) {
    if (bs.margin.top) styles['margin-top'] = bs.margin.top
    if (bs.margin.right) styles['margin-right'] = bs.margin.right
    if (bs.margin.bottom) styles['margin-bottom'] = bs.margin.bottom
    if (bs.margin.left) styles['margin-left'] = bs.margin.left
    if (bs.margin.topTablet) styles['--mt-tablet'] = bs.margin.topTablet
    if (bs.margin.rightTablet) styles['--mr-tablet'] = bs.margin.rightTablet
    if (bs.margin.bottomTablet) styles['--mb-tablet'] = bs.margin.bottomTablet
    if (bs.margin.leftTablet) styles['--ml-tablet'] = bs.margin.leftTablet
    if (bs.margin.topMobile) styles['--mt-mobile'] = bs.margin.topMobile
    if (bs.margin.rightMobile) styles['--mr-mobile'] = bs.margin.rightMobile
    if (bs.margin.bottomMobile) styles['--mb-mobile'] = bs.margin.bottomMobile
    if (bs.margin.leftMobile) styles['--ml-mobile'] = bs.margin.leftMobile
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
