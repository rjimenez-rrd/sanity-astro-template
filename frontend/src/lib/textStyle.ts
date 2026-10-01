import {stegaClean} from '@sanity/client/stega'
import {fontStack} from './fonts'
import {clamp, safeColor} from './cssValues'

/** A Text Style from the Studio (studio objects/text-style.ts). */
export interface TextStyle {
  font?: string | null
  weight?: string | null
  fontSize?: number | null
  fontSizeTablet?: number | null
  fontSizeMobile?: number | null
  color?: string | null
  letterSpacing?: number | null
  textTransform?: string | null
  italic?: boolean | null
  shadowColor?: string | null
  shadowX?: number | null
  shadowY?: number | null
  shadowBlur?: number | null
}

const WEIGHTS = new Set(['300', '400', '500', '600', '700', '800', '900'])
const TRANSFORMS = new Set(['none', 'uppercase', 'lowercase', 'capitalize'])

const color = safeColor
const num = clamp
const px = (n: unknown, min: number, max: number) => {
  const v = num(n, min, max)
  return v === undefined ? undefined : `${v}px`
}

/**
 * A Text Style as an inline `style` value, or undefined when it sets nothing.
 * Every value is checked first, since editors type them. Tablet and mobile
 * sizes use the same --fs-tablet/--fs-mobile properties as Block Styles,
 * which global.css applies below each breakpoint.
 */
export function textStyleAttr(raw: TextStyle | null | undefined): string | undefined {
  if (!raw) return undefined
  const s = stegaClean(raw)
  const shadow = color(s.shadowColor)
  const rules: Record<string, string | undefined> = {
    'font-family': fontStack(s.font),
    'font-weight': s.weight && WEIGHTS.has(s.weight) ? s.weight : undefined,
    'font-size': px(s.fontSize, 1, 400),
    '--fs-tablet': px(s.fontSizeTablet, 1, 400),
    '--fs-mobile': px(s.fontSizeMobile, 1, 400),
    color: color(s.color),
    'letter-spacing': px(s.letterSpacing, -20, 50),
    'text-transform': s.textTransform && TRANSFORMS.has(s.textTransform) ? s.textTransform : undefined,
    'font-style': s.italic ? 'italic' : undefined,
    'text-shadow': shadow
      ? `${num(s.shadowX, -100, 100) ?? 0}px ${num(s.shadowY, -100, 100) ?? 0}px ${num(s.shadowBlur, 0, 200) ?? 0}px ${shadow}`
      : undefined,
  }
  const style = Object.entries(rules)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return style || undefined
}
