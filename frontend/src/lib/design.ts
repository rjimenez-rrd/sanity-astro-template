/**
 * CSS for the Style tab: background, background overlay and border, each with
 * a hover state. Editor values are whitelisted or validated before they reach
 * CSS; image URLs are built from the asset reference, never taken as text.
 */
import {urlFor} from '@/sanity/lib/image'
import {MEDIA, resolve, type CssBuilder, type Device, type Responsive} from './container'

type Sides = {top?: number | null; right?: number | null; bottom?: number | null; left?: number | null; unit?: string | null}

export interface BackgroundState {
  type?: string | null
  color?: string | null
  image?: {asset?: {_ref?: string} | null} | null
  imageTablet?: {asset?: {_ref?: string} | null} | null
  imageMobile?: {asset?: {_ref?: string} | null} | null
  imageResolution?: string | null
  position?: Responsive<string>
  attachment?: string | null
  repeat?: Responsive<string>
  size?: Responsive<string>
  gradient?: {
    color?: string | null
    location?: Responsive<number>
    secondColor?: string | null
    secondLocation?: Responsive<number>
    gradientType?: string | null
    angle?: Responsive<number>
    position?: string | null
  } | null
  /** Responsive; a plain number is accepted as the desktop value. */
  opacity?: Responsive<number> | number | null
  filters?: {
    blur?: number | null
    brightness?: number | null
    contrast?: number | null
    saturate?: number | null
    hue?: number | null
  } | null
  blendMode?: string | null
  transition?: number | null
}

export interface BorderState {
  type?: string | null
  width?: Responsive<Sides>
  color?: string | null
  radius?: Responsive<Sides>
  shadow?: {
    color?: string | null
    horizontal?: number | null
    vertical?: number | null
    blur?: number | null
    spread?: number | null
    position?: string | null
  } | null
  transition?: number | null
}

export interface DesignSettings {
  background?: {normal?: BackgroundState | null; hover?: BackgroundState | null} | null
  overlay?: {normal?: BackgroundState | null; hover?: BackgroundState | null} | null
  border?: {normal?: BorderState | null; hover?: BorderState | null} | null
}

const DEVICES: Device[] = ['desktop', 'tablet', 'mobile']
const POSITIONS = new Set([
  'center center', 'center left', 'center right', 'top center', 'top left', 'top right',
  'bottom center', 'bottom left', 'bottom right',
])
const REPEATS = new Set(['no-repeat', 'repeat', 'repeat-x', 'repeat-y'])
const SIZES = new Set(['auto', 'cover', 'contain'])
const BORDER_TYPES = new Set(['none', 'solid', 'double', 'dotted', 'dashed', 'groove'])
const UNITS = new Set(['px', '%', 'em', 'rem'])
const BLEND_MODES = new Set([
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge',
  'saturation', 'color', 'difference', 'exclusion', 'hue', 'luminosity',
])
const RESOLUTION_WIDTH: Record<string, number> = {
  full: 2560,
  large: 1024,
  medium_large: 768,
  medium: 300,
  thumbnail: 150,
}

const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(\s*[-\d.%,\s/deg]+\)|[a-z]{3,20})$/i
function color(value: string | null | undefined): string | undefined {
  const c = value?.trim()
  return c && COLOR.test(c) ? c : undefined
}

function num(n: unknown, min: number, max: number): number | undefined {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined
  return Math.round(Math.min(max, Math.max(min, n)) * 1000) / 1000
}

function pick(value: string | null | undefined, allowed: Set<string>): string | undefined {
  return value && allowed.has(value) ? value : undefined
}

function imageUrl(image: BackgroundState['image'], resolution: string | null | undefined): string | undefined {
  if (!image?.asset?._ref) return undefined
  const width = RESOLUTION_WIDTH[resolution ?? 'full'] ?? RESOLUTION_WIDTH.full
  try {
    const url = urlFor(image as never).width(width).fit('max').auto('format').url()
    return /^https:\/\/cdn\.sanity\.io\/[^"'()\s\\]+$/.test(url) ? `url("${url}")` : undefined
  } catch {
    return undefined
  }
}

/** The gradient in effect on one device (locations and angle are responsive). */
function gradient(g: NonNullable<BackgroundState['gradient']>, device: Device): string | undefined {
  const c1 = color(g.color)
  const c2 = color(g.secondColor)
  if (!c1 && !c2) return undefined
  // Locations may run past 0–100% (Elementor allows it) to stretch the fade.
  const l1 = num(resolve(g.location, device).value, -100, 300) ?? 0
  const l2 = num(resolve(g.secondLocation, device).value, -100, 300) ?? 100
  const stops = `${c1 ?? 'transparent'} ${l1}%, ${c2 ?? 'transparent'} ${l2}%`
  if (g.gradientType === 'radial') {
    return `radial-gradient(at ${pick(g.position, POSITIONS) ?? 'center center'}, ${stops})`
  }
  return `linear-gradient(${num(resolve(g.angle, device).value, -360, 360) ?? 180}deg, ${stops})`
}

/** Whether any responsive gradient value is set specifically for this device. */
function gradientChangesOn(g: NonNullable<BackgroundState['gradient']>, device: Device): boolean {
  return device === 'desktop' || [g.location, g.secondLocation, g.angle].some((r) => resolve(r, device).own)
}

function asResponsive(value: Responsive<number> | number | null | undefined): Responsive<number> {
  return typeof value === 'number' ? {desktop: value} : value
}

function filters(f: BackgroundState['filters']): string | undefined {
  if (!f) return undefined
  const parts = [
    num(f.blur, 0, 50) !== undefined ? `blur(${num(f.blur, 0, 50)}px)` : undefined,
    num(f.brightness, 0, 500) !== undefined ? `brightness(${num(f.brightness, 0, 500)}%)` : undefined,
    num(f.contrast, 0, 500) !== undefined ? `contrast(${num(f.contrast, 0, 500)}%)` : undefined,
    num(f.saturate, 0, 500) !== undefined ? `saturate(${num(f.saturate, 0, 500)}%)` : undefined,
    num(f.hue, -360, 360) !== undefined ? `hue-rotate(${num(f.hue, -360, 360)}deg)` : undefined,
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

function sides(value: Sides | null | undefined): string | undefined {
  if (!value) return undefined
  const unit = value.unit && UNITS.has(value.unit) ? value.unit : 'px'
  const parts = [value.top, value.right, value.bottom, value.left].map((n) => num(n, 0, 1000))
  if (parts.every((n) => n === undefined)) return undefined
  return parts.map((n) => `${n ?? 0}${unit}`).join(' ')
}

/** Background declarations for one state; responsive parts go per device. */
function addBackground(css: CssBuilder, selector: string, bg: BackgroundState | null | undefined) {
  if (!bg?.type) return
  if (bg.type === 'gradient') {
    const g = bg.gradient
    if (!g) return
    for (const device of DEVICES) {
      if (gradientChangesOn(g, device)) css.add(MEDIA[device], selector, {'background-image': gradient(g, device)})
    }
    return
  }
  if (bg.type !== 'classic') return

  // Desktop is the base; a tablet or mobile image replaces it from that
  // breakpoint down. The max-width media queries cascade, so mobile inherits a
  // tablet image unless it has its own.
  const desktop = imageUrl(bg.image, bg.imageResolution)
  const tablet = imageUrl(bg.imageTablet, bg.imageResolution)
  const mobile = imageUrl(bg.imageMobile, bg.imageResolution)
  const hasImage = Boolean(desktop || tablet || mobile)

  css.add(null, selector, {
    'background-color': color(bg.color),
    'background-image': desktop,
    'background-attachment': hasImage && bg.attachment === 'fixed' ? 'fixed' : undefined,
  })
  if (tablet) css.add(MEDIA.tablet, selector, {'background-image': tablet})
  if (mobile) css.add(MEDIA.mobile, selector, {'background-image': mobile})
  if (!hasImage) return
  for (const device of DEVICES) {
    const position = resolve(bg.position, device)
    const repeat = resolve(bg.repeat, device)
    const size = resolve(bg.size, device)
    css.add(MEDIA[device], selector, {
      'background-position': position.own ? pick(position.value, POSITIONS) : undefined,
      'background-repeat': repeat.own ? pick(repeat.value, REPEATS) : undefined,
      'background-size': size.own ? pick(size.value, SIZES) : undefined,
    })
  }
}

function addBorder(css: CssBuilder, selector: string, b: BorderState | null | undefined) {
  if (!b) return
  const type = pick(b.type, BORDER_TYPES)
  const sh = b.shadow
  const shadowColor = color(sh?.color)
  css.add(null, selector, {
    'border-style': type,
    'border-color': type && type !== 'none' ? color(b.color) : undefined,
    'box-shadow': shadowColor
      ? `${sh?.position === 'inset' ? 'inset ' : ''}${num(sh?.horizontal, -500, 500) ?? 0}px ${num(sh?.vertical, -500, 500) ?? 0}px ${num(sh?.blur, 0, 500) ?? 10}px ${num(sh?.spread, -500, 500) ?? 0}px ${shadowColor}`
      : undefined,
  })
  for (const device of DEVICES) {
    const width = resolve(b.width, device)
    const radius = resolve(b.radius, device)
    css.add(MEDIA[device], selector, {
      'border-width': type && type !== 'none' && width.own ? sides(width.value) : undefined,
      'border-radius': radius.own ? sides(radius.value) : undefined,
    })
  }
}

/** Overlay opacity per device; Elementor's default is 0.5. */
function addOpacity(css: CssBuilder, selector: string, value: BackgroundState['opacity']) {
  const opacity = asResponsive(value)
  for (const device of DEVICES) {
    const r = resolve(opacity, device)
    if (device === 'desktop') css.add(null, selector, {opacity: String(num(r.value, 0, 1) ?? 0.5)})
    else if (r.own) css.add(MEDIA[device], selector, {opacity: String(num(r.value, 0, 1))})
  }
}

const has = (state: BackgroundState | BorderState | null | undefined) =>
  Boolean(state && Object.values(state).some((v) => v !== undefined && v !== null && v !== ''))

/** Which legacy block-style properties the Style panel now owns. */
export function designOverrides(design: DesignSettings | null | undefined) {
  return {
    background: has(design?.background?.normal) || has(design?.background?.hover),
    overlay: has(design?.overlay?.normal) || has(design?.overlay?.hover),
    border: has(design?.border?.normal) || has(design?.border?.hover),
  }
}

export function buildDesignCss(key: string, design: DesignSettings | null | undefined, css: CssBuilder) {
  if (!design) return css
  const outer = `[data-pb="${key}"]`
  const hover = `${outer}:hover`

  addBackground(css, outer, design.background?.normal)
  addBackground(css, hover, design.background?.hover)
  addBorder(css, outer, design.border?.normal)
  addBorder(css, hover, design.border?.hover)

  // Hover transitions, as Elementor applies them to the element itself.
  const bgT = num(design.background?.hover?.transition, 0, 10)
  const borderT = num(design.border?.hover?.transition, 0, 10)
  const transitions = [
    has(design.background?.hover) ? `background ${bgT ?? 0.3}s` : undefined,
    has(design.border?.hover)
      ? `border ${borderT ?? 0.3}s, border-radius ${borderT ?? 0.3}s, box-shadow ${borderT ?? 0.3}s`
      : undefined,
  ].filter(Boolean)
  if (transitions.length) css.add(null, outer, {transition: transitions.join(', ')})

  // Overlay: a ::before layer between the element's background and content.
  const overlayNormal = design.overlay?.normal
  const overlayHover = design.overlay?.hover
  if (overlayNormal?.type || overlayHover?.type) {
    const before = `${outer}::before`
    const overlayT = num(overlayHover?.transition, 0, 10) ?? 0.3
    css.add(null, outer, {position: 'relative', isolation: 'isolate'})
    css.add(null, before, {
      content: "''",
      position: 'absolute',
      inset: '0',
      'z-index': '-1',
      'pointer-events': 'none',
      'border-radius': 'inherit',
      opacity: overlayNormal?.type ? undefined : '0',
      filter: overlayNormal?.type ? filters(overlayNormal.filters) : undefined,
      'mix-blend-mode': overlayNormal?.type ? pick(overlayNormal.blendMode, BLEND_MODES) : undefined,
      transition: overlayHover?.type
        ? `background ${overlayT}s, opacity ${overlayT}s, filter ${overlayT}s`
        : undefined,
    })
    addBackground(css, before, overlayNormal)
    if (overlayNormal?.type) addOpacity(css, before, overlayNormal.opacity)

    if (overlayHover?.type) {
      const hoverBefore = `${hover}::before`
      addBackground(css, hoverBefore, overlayHover)
      addOpacity(css, hoverBefore, overlayHover.opacity)
      css.add(null, hoverBefore, {
        filter: filters(overlayHover.filters),
        'mix-blend-mode': pick(overlayHover.blendMode, BLEND_MODES),
      })
    }
  }
  return css
}
