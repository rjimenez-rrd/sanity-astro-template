/** HSV + alpha, all 0–1 except hue (0–360). The picker works in this space. */
export type Hsva = {h: number; s: number; v: number; a: number}
export type ColorFormat = 'hexa' | 'rgba' | 'hsla'

type Rgba = {r: number; g: number; b: number; a: number}

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))
const round = (n: number, places = 0) => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

let ctx: CanvasRenderingContext2D | null | undefined

/**
 * Parses any CSS color (hex, rgb[a], hsl[a], named…) by letting the browser
 * normalise it through a canvas, which yields `#rrggbb` or `rgba(...)`.
 */
export function parseColor(input: string | undefined): Hsva | null {
  const value = input?.trim()
  if (!value) return null
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null

  // An invalid color leaves fillStyle unchanged, so probe with two sentinels.
  ctx.fillStyle = '#000000'
  ctx.fillStyle = value
  const first = String(ctx.fillStyle)
  ctx.fillStyle = '#ffffff'
  ctx.fillStyle = value
  if (String(ctx.fillStyle) !== first) return null

  return rgbaToHsva(normalisedToRgba(first))
}

function normalisedToRgba(s: string): Rgba {
  if (s.startsWith('#')) {
    const n = parseInt(s.slice(1, 7), 16)
    return {r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1}
  }
  const [r, g, b, a = 1] = s.replace(/[^\d.,]/g, '').split(',').map(Number)
  return {r, g, b, a}
}

function rgbaToHsva({r, g, b, a}: Rgba): Hsva {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return {h, s: max ? d / max : 0, v: max, a: clamp(a)}
}

function hsvaToRgba({h, s, v, a}: Hsva): Rgba {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return {r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255), a}
}

function hsvaToHsla({h, s, v, a}: Hsva) {
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return {h, s: sl, l, a}
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase()

/** Formats in the chosen notation; hex drops the alpha pair when opaque. */
export function formatColor(color: Hsva, format: ColorFormat): string {
  const {r, g, b, a} = hsvaToRgba(color)
  if (format === 'rgba') return `rgba(${r}, ${g}, ${b}, ${round(a, 2)})`
  if (format === 'hsla') {
    const hsl = hsvaToHsla(color)
    return `hsla(${round(hsl.h)}, ${round(hsl.s * 100)}%, ${round(hsl.l * 100)}%, ${round(a, 2)})`
  }
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`
}

/** Guesses the notation a stored value was written in, to keep editing in it. */
export function detectFormat(value: string | undefined): ColorFormat {
  const v = value?.trim().toLowerCase() ?? ''
  if (v.startsWith('rgb')) return 'rgba'
  if (v.startsWith('hsl')) return 'hsla'
  return 'hexa'
}

/** Opaque CSS color for the hue/alpha track backgrounds. */
export function toCss(color: Hsva): string {
  const {r, g, b, a} = hsvaToRgba(color)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export {clamp}
