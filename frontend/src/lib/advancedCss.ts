/**
 * CSS for the Advanced tab settings of a container or column that position
 * and shape it: Align Self, Size, Position and Transform. (Margin, padding,
 * Order and Z-Index are handled with the container's own CSS, container.ts.)
 *
 * Everything is scoped to the element's [data-pb="key"], and every value is
 * checked against what it may be before it reaches CSS.
 */
import {CssBuilder, MEDIA, resolve, type Responsive} from './container'
import {DEVICES, clamp} from './cssValues'

type FlexSize = {mode?: string | null; grow?: number | null; shrink?: number | null}

export interface AdvancedLayout {
  alignSelf?: Responsive<string>
  size?: Responsive<FlexSize>
  position?: {
    type?: string | null
    horizontal?: string | null
    offsetX?: string | null
    vertical?: string | null
    offsetY?: string | null
  } | null
  transform?: {
    rotate?: number | null
    scale?: number | null
    translateX?: string | null
    translateY?: string | null
    skewX?: number | null
    skewY?: number | null
  } | null
}

const ALIGN = new Set(['flex-start', 'center', 'flex-end', 'stretch'])
const POSITION = new Set(['absolute', 'fixed'])
const LENGTH = /^-?\d+(\.\d+)?(px|%|em|rem|vw|vh)$/

const length = (v: string | null | undefined) => (v === '0' ? '0' : v && LENGTH.test(v) ? v : undefined)
const number = clamp

/** flex for a Size choice: None keeps its size, Grow fills, Shrink gives way. */
function flexFor(size: FlexSize | null | undefined): string | undefined {
  switch (size?.mode) {
    case 'none':
      return '0 0 auto'
    case 'grow':
      return '1 1 0%'
    case 'shrink':
      return '0 1 auto'
    case 'custom': {
      const grow = number(size.grow, 0, 99) ?? 0
      const shrink = number(size.shrink, 0, 99) ?? 1
      return `${grow} ${shrink} auto`
    }
    default:
      return undefined
  }
}

export function buildAdvancedCss(key: string, advanced: AdvancedLayout | null | undefined, css = new CssBuilder()) {
  if (!advanced) return css
  const outer = `[data-pb="${key}"]`

  // Align Self and Size, per device, only where set: desktop-first media
  // queries carry a desktop value down until a smaller device overrides it.
  for (const device of DEVICES) {
    const media = MEDIA[device]
    const align = resolve(advanced.alignSelf, device)
    if (align.own && align.value && ALIGN.has(align.value)) css.add(media, outer, {'align-self': align.value})

    const size = resolve(advanced.size, device)
    const flex = size.own ? flexFor(size.value) : undefined
    // !important: a column's own width rule sets flex too, and Size is the
    // editor's explicit override of it.
    if (flex) css.add(media, outer, {flex: `${flex} !important`})
  }

  // Position: Absolute or Fixed, against the chosen sides.
  const p = advanced.position
  if (p?.type && POSITION.has(p.type)) {
    const horizontal = p.horizontal === 'right' ? 'right' : 'left'
    const vertical = p.vertical === 'bottom' ? 'bottom' : 'top'
    css.add(null, outer, {
      position: p.type,
      [horizontal]: length(p.offsetX) ?? '0',
      [vertical]: length(p.offsetY) ?? '0',
    })
  }

  // Transform: rotate, scale, move and skew, in one transform.
  const t = advanced.transform
  if (t) {
    const parts = [
      length(t.translateX) || length(t.translateY)
        ? `translate(${length(t.translateX) ?? '0'}, ${length(t.translateY) ?? '0'})`
        : undefined,
      number(t.rotate, -360, 360) !== undefined ? `rotate(${number(t.rotate, -360, 360)}deg)` : undefined,
      number(t.scale, 0, 10) !== undefined ? `scale(${number(t.scale, 0, 10)})` : undefined,
      number(t.skewX, -89, 89) !== undefined ? `skewX(${number(t.skewX, -89, 89)}deg)` : undefined,
      number(t.skewY, -89, 89) !== undefined ? `skewY(${number(t.skewY, -89, 89)}deg)` : undefined,
    ].filter(Boolean)
    if (parts.length > 0) css.add(null, outer, {transform: parts.join(' ')})
  }

  return css
}

/**
 * Attributes, one per line as key|value (Elementor's format). Only safe
 * names: letters, digits and hyphens, never an event handler (on…), style,
 * id or class — those have their own settings or aren't allowed.
 */
export function parseAttributes(raw: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of (raw ?? '').split('\n')) {
    const [name, ...rest] = line.split('|')
    const key = name?.trim().toLowerCase()
    if (!key || !/^[a-z][a-z0-9-]*$/.test(key)) continue
    if (key.startsWith('on') || ['style', 'id', 'class', 'href', 'src'].includes(key)) continue
    out[key] = rest.join('|').trim()
  }
  return out
}
