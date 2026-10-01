/**
 * Shared rules for editor input that ends up in CSS: the devices and their
 * breakpoints, and the checks a value must pass before it's written out.
 * One place, so a color or a breakpoint means the same thing everywhere.
 */

// --- Devices and breakpoints -----------------------------------------------------

export const DEVICES = ['desktop', 'tablet', 'mobile'] as const
export type Device = (typeof DEVICES)[number]

/**
 * Desktop-first: desktop is the base (no media query) and each smaller device
 * overrides it below its breakpoint. The Studio's device switcher and the
 * `--*-tablet` / `--*-mobile` rules in global.css use the same widths.
 */
export const MEDIA: Record<Device, string | null> = {
  desktop: null,
  tablet: '@media (max-width: 1024px)',
  mobile: '@media (max-width: 767px)',
}

/** Exactly one device each, for Hide On Desktop / Tablet / Mobile. */
export const VISIBILITY_MEDIA: Record<Device, string> = {
  desktop: '@media (min-width: 1025px)',
  tablet: '@media (min-width: 768px) and (max-width: 1024px)',
  mobile: '@media (max-width: 767px)',
}

/** Tablet and up: a grid's own columns, which collapse to one on mobile. */
export const FROM_TABLET = '@media (min-width: 768px)'

/**
 * The order generated media rules are written in: base rules first, then
 * larger screens before smaller ones, so a smaller device's override wins.
 */
export const MEDIA_ORDER: string[] = [
  ...new Set([
    '',
    FROM_TABLET,
    MEDIA.tablet!,
    VISIBILITY_MEDIA.tablet,
    MEDIA.mobile!,
    ...Object.values(VISIBILITY_MEDIA),
  ]),
]

// --- Value checks --------------------------------------------------------------

/**
 * A CSS color: hex, rgb()/rgba(), hsl()/hsla() or a color name. Nothing that
 * could close the declaration (no `;`, braces or quotes) gets through.
 */
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(\s*[-\d.%,\s/deg]+\)|[a-z]{3,30})$/i

export function safeColor(value: string | null | undefined): string | undefined {
  const c = value?.trim()
  return c && COLOR.test(c) ? c : undefined
}

/**
 * A finite number held between min and max, or undefined. `precision` rounds
 * to that many decimals (e.g. 3: 0.33333 -> 0.333).
 */
export function clamp(
  n: unknown,
  min: number,
  max: number,
  {precision}: {precision?: number} = {},
): number | undefined {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined
  const held = Math.min(max, Math.max(min, n))
  if (precision === undefined) return held
  const factor = 10 ** precision
  return Math.round(held * factor) / factor
}

/** The value if it's one of the allowed options, else undefined. */
export function pickEnum(value: string | null | undefined, allowed: ReadonlySet<string>): string | undefined {
  return value && allowed.has(value) ? value : undefined
}
