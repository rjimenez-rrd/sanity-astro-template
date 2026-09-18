export interface BlockStyles {
  padding?: {
    top?: string | null; right?: string | null; bottom?: string | null; left?: string | null
    topMd?: string | null; rightMd?: string | null; bottomMd?: string | null; leftMd?: string | null
    topLg?: string | null; rightLg?: string | null; bottomLg?: string | null; leftLg?: string | null
  } | null
  margin?: {
    top?: string | null; right?: string | null; bottom?: string | null; left?: string | null
    topMd?: string | null; rightMd?: string | null; bottomMd?: string | null; leftMd?: string | null
    topLg?: string | null; rightLg?: string | null; bottomLg?: string | null; leftLg?: string | null
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

type StyleMap = Record<string, string | number | undefined>

export function buildStyles(bs: BlockStyles | undefined | null): StyleMap {
  if (!bs) return {}

  const styles: StyleMap = {}

  // Padding — base as real properties, responsive as custom properties that
  // the media queries in global.css promote at md/lg.
  if (bs.padding) {
    if (bs.padding.top) styles['padding-top'] = bs.padding.top
    if (bs.padding.right) styles['padding-right'] = bs.padding.right
    if (bs.padding.bottom) styles['padding-bottom'] = bs.padding.bottom
    if (bs.padding.left) styles['padding-left'] = bs.padding.left
    if (bs.padding.topMd) styles['--pt-md'] = bs.padding.topMd
    if (bs.padding.rightMd) styles['--pr-md'] = bs.padding.rightMd
    if (bs.padding.bottomMd) styles['--pb-md'] = bs.padding.bottomMd
    if (bs.padding.leftMd) styles['--pl-md'] = bs.padding.leftMd
    if (bs.padding.topLg) styles['--pt-lg'] = bs.padding.topLg
    if (bs.padding.rightLg) styles['--pr-lg'] = bs.padding.rightLg
    if (bs.padding.bottomLg) styles['--pb-lg'] = bs.padding.bottomLg
    if (bs.padding.leftLg) styles['--pl-lg'] = bs.padding.leftLg
  }

  // Margin — same pattern
  if (bs.margin) {
    if (bs.margin.top) styles['margin-top'] = bs.margin.top
    if (bs.margin.right) styles['margin-right'] = bs.margin.right
    if (bs.margin.bottom) styles['margin-bottom'] = bs.margin.bottom
    if (bs.margin.left) styles['margin-left'] = bs.margin.left
    if (bs.margin.topMd) styles['--mt-md'] = bs.margin.topMd
    if (bs.margin.rightMd) styles['--mr-md'] = bs.margin.rightMd
    if (bs.margin.bottomMd) styles['--mb-md'] = bs.margin.bottomMd
    if (bs.margin.leftMd) styles['--ml-md'] = bs.margin.leftMd
    if (bs.margin.topLg) styles['--mt-lg'] = bs.margin.topLg
    if (bs.margin.rightLg) styles['--mr-lg'] = bs.margin.rightLg
    if (bs.margin.bottomLg) styles['--mb-lg'] = bs.margin.bottomLg
    if (bs.margin.leftLg) styles['--ml-lg'] = bs.margin.leftLg
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
