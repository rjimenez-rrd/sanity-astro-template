/**
 * Turns the Studio's Elementor-style container settings into scoped CSS.
 *
 * Desktop is the base and tablet/mobile override it, at Elementor's
 * breakpoints. Values arrive from editors, so everything that reaches CSS is
 * whitelisted or clamped here — never interpolated raw.
 */

export type Device = 'desktop' | 'tablet' | 'mobile'
export type Responsive<T> = Partial<Record<Device, T | null>> | null | undefined
type Size = {size?: number | null; unit?: string | null} | null

export interface ContainerSettings {
  layoutType?: string | null
  contentWidth?: string | null
  width?: Responsive<Size>
  minHeight?: Responsive<Size>
  gridColumns?: Responsive<number>
  direction?: Responsive<string>
  justifyContent?: Responsive<string>
  alignItems?: Responsive<string>
  justifyItems?: Responsive<string>
  gap?:
    | (Partial<Record<Device, {column?: number | null; row?: number | null; unit?: string | null} | null>> & {
        linked?: boolean | null
      })
    | null
  wrap?: Responsive<string>
}

export interface VisibilitySettings {
  hideOnDesktop?: boolean | null
  hideOnTablet?: boolean | null
  hideOnMobile?: boolean | null
}

const DEVICES: Device[] = ['desktop', 'tablet', 'mobile']

/** Elementor's default "Content Width" for a boxed container. */
export const BOXED_DEFAULT_WIDTH = 1140

export const MEDIA: Record<Device, string | null> = {
  desktop: null,
  tablet: '@media (max-width: 1024px)',
  mobile: '@media (max-width: 767px)',
}

const VISIBILITY_MEDIA: Record<Device, string> = {
  desktop: '@media (min-width: 1025px)',
  tablet: '@media (min-width: 768px) and (max-width: 1024px)',
  mobile: '@media (max-width: 767px)',
}

const FALLBACK: Record<Device, Device[]> = {
  desktop: ['desktop'],
  tablet: ['tablet', 'desktop'],
  mobile: ['mobile', 'tablet', 'desktop'],
}

const DIRECTIONS = new Set(['row', 'column', 'row-reverse', 'column-reverse'])
const JUSTIFY = new Set(['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'])
const ALIGN = new Set(['flex-start', 'center', 'flex-end', 'stretch'])
const WRAP = new Set(['nowrap', 'wrap'])
const SIZE_UNITS = new Set(['px', '%', 'vw', 'vh', 'em', 'rem'])

/** Legacy grid presets, reused as the Grid-mode template for rows. */
const GRID_TEMPLATES: Record<string, string> = {
  full: 'minmax(0, 1fr)',
  '50-50': 'repeat(2, minmax(0, 1fr))',
  '33-66': 'minmax(0, 1fr) minmax(0, 2fr)',
  '66-33': 'minmax(0, 2fr) minmax(0, 1fr)',
  '25-75': 'minmax(0, 1fr) minmax(0, 3fr)',
  '75-25': 'minmax(0, 3fr) minmax(0, 1fr)',
  '33-33-33': 'repeat(3, minmax(0, 1fr))',
  '25-50-25': 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)',
  '25-25-25-25': 'repeat(4, minmax(0, 1fr))',
}

export function resolve<T>(value: Responsive<T>, device: Device): {value: T | undefined; own: boolean} {
  for (const d of FALLBACK[device]) {
    const v = value?.[d]
    if (v !== undefined && v !== null && (v as unknown) !== '') return {value: v, own: d === device}
  }
  return {value: undefined, own: false}
}

function pickEnum(value: string | undefined, allowed: Set<string>): string | undefined {
  return value && allowed.has(value) ? value : undefined
}

function num(n: unknown, min: number, max: number): number | undefined {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined
  return Math.round(Math.min(max, Math.max(min, n)) * 1000) / 1000
}

function size(value: Size | undefined, fallbackUnit: string, allowZero = false): string | undefined {
  const n = num(value?.size, 0, 10000)
  if (n === undefined || (n === 0 && !allowZero)) return undefined
  const unit = value?.unit && SIZE_UNITS.has(value.unit) ? value.unit : fallbackUnit
  return `${n}${unit}`
}

/** Sanity keys are alphanumeric; anything else never becomes a selector. */
export function safeKey(key: string | undefined | null): string | undefined {
  return key && /^[A-Za-z0-9_-]+$/.test(key) ? key : undefined
}

export function safeCssId(id: string | undefined | null): string | undefined {
  const trimmed = id?.trim()
  return trimmed && /^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmed) ? trimmed : undefined
}

export function safeCssClasses(classes: string | undefined | null): string | undefined {
  const list = (classes ?? '').split(/\s+/).filter((c) => /^[A-Za-z_-][A-Za-z0-9_-]*$/.test(c))
  return list.length > 0 ? list.join(' ') : undefined
}

type Declarations = Record<string, string | undefined>

class CssBuilder {
  private rules: Record<string, Map<string, Declarations>> = {}

  add(media: string | null, selector: string, decls: Declarations) {
    const clean = Object.fromEntries(Object.entries(decls).filter(([, v]) => v !== undefined))
    if (Object.keys(clean).length === 0) return
    const bucket = (this.rules[media ?? ''] ??= new Map())
    bucket.set(selector, {...bucket.get(selector), ...clean})
  }

  toString(): string {
    // Base rules first, then tablet, then mobile, so overrides win.
    const order = [
      '',
      '@media (min-width: 768px)',
      MEDIA.tablet!,
      '@media (min-width: 768px) and (max-width: 1024px)',
      MEDIA.mobile!,
      ...Object.values(VISIBILITY_MEDIA),
    ]
    const seen = new Set<string>()
    let out = ''
    for (const media of order) {
      if (seen.has(media)) continue
      seen.add(media)
      const bucket = this.rules[media]
      if (!bucket) continue
      let body = ''
      for (const [selector, decls] of bucket) {
        body += `${selector}{${Object.entries(decls)
          .map(([k, v]) => `${k}:${v}`)
          .join(';')}}`
      }
      out += media ? `${media}{${body}}` : body
    }
    return out
  }
}

export interface ContainerCssInput {
  key: string
  variant: 'row' | 'column'
  container: ContainerSettings
  /** Legacy grid preset, used as the template when a row is in Grid mode. */
  gridTemplate?: string | null
  zIndex?: number | null
  visibility?: VisibilitySettings | null
  /** For a column: the parent row's settings, to size it as a flex item. */
  parent?: ContainerSettings
}

/** Effective flex direction on a device, with the renderer's default. */
export function directionFor(container: ContainerSettings | undefined, variant: 'row' | 'column', device: Device) {
  return (
    pickEnum(resolve(container?.direction, device).value, DIRECTIONS) ??
    (variant === 'column' ? 'column' : 'row')
  )
}

export function buildContainerCss(input: ContainerCssInput, css = new CssBuilder()): CssBuilder {
  const {key, variant, container: c, gridTemplate, zIndex, visibility, parent} = input
  const outer = `[data-pb="${key}"]`
  const inner = `[data-pb-inner="${key}"]`
  const items = `${inner}>*`
  const isGrid = c.layoutType === 'grid'

  const z = num(zIndex, -9999, 9999)
  if (z !== undefined) css.add(null, outer, {position: 'relative', 'z-index': String(Math.round(z))})

  css.add(null, inner, {display: isGrid ? 'grid' : 'flex'})


  // Smaller breakpoints only restate what actually changes.
  let prevDirection: string | undefined
  let prevItemWidth: string | undefined

  for (const device of DEVICES) {
    const media = MEDIA[device]

    // --- Container box ---
    if (variant === 'row' && c.contentWidth === 'boxed') {
      const width = resolve(c.width, device)
      if (width.own || device === 'desktop') {
        // Boxed with no width falls back to Elementor's default content width.
        const w = size(width.value ?? undefined, 'px') ?? `${BOXED_DEFAULT_WIDTH}px`
        css.add(media, inner, {'max-width': w, 'margin-inline': 'auto'})
      }
    }

    const minHeight = resolve(c.minHeight, device)
    if (minHeight.own) css.add(media, inner, {'min-height': size(minHeight.value ?? undefined, 'px')})

    // --- Gaps (own values only; inherited ones already cascade) ---
    const gap = resolve(c.gap as Responsive<{column?: number | null; row?: number | null; unit?: string | null}>, device)
    if (gap.own && gap.value) {
      const unit = gap.value.unit && SIZE_UNITS.has(gap.value.unit) ? gap.value.unit : 'px'
      const col = num(gap.value.column, 0, 1000)
      const row = num(gap.value.row, 0, 1000)
      css.add(media, inner, {
        'column-gap': col !== undefined ? `${col}${unit}` : undefined,
        'row-gap': row !== undefined ? `${row}${unit}` : undefined,
      })
    }

    if (isGrid) {
      // --- Grid ---
      let template: string | undefined
      if (variant === 'row') {
        // Presets collapse to one column on mobile, as the legacy grid did.
        if (device === 'desktop') template = GRID_TEMPLATES[gridTemplate ?? ''] ?? GRID_TEMPLATES['50-50']
        if (device === 'mobile') template = 'minmax(0, 1fr)'
      } else {
        const cols = resolve(c.gridColumns, device)
        const n = num(cols.value, 1, 12)
        if (cols.own || device === 'desktop') template = `repeat(${Math.round(n ?? 1)}, minmax(0, 1fr))`
      }
      const justifyItems = resolve(c.justifyItems, device)
      const alignItems = resolve(c.alignItems, device)
      css.add(media, inner, {
        'grid-template-columns': template,
        'justify-items': justifyItems.own ? pickEnum(justifyItems.value, ALIGN)?.replace('flex-', '') : undefined,
        'align-items': alignItems.own ? pickEnum(alignItems.value, ALIGN)?.replace('flex-', '') : undefined,
      })
    } else {
      // --- Flex ---
      const direction = directionFor(c, variant, device)
      const justify = resolve(c.justifyContent, device)
      const align = resolve(c.alignItems, device)
      const wrap = resolve(c.wrap, device)
      const directionChanged = direction !== prevDirection
      prevDirection = direction
      css.add(media, inner, {
        'flex-direction': directionChanged ? direction : undefined,
        'justify-content': justify.own ? pickEnum(justify.value, JUSTIFY) : undefined,
        'align-items': align.own ? pickEnum(align.value, ALIGN) : undefined,
        'flex-wrap': wrap.own ? pickEnum(wrap.value, WRAP) : undefined,
      })

      // Along a row, items share the space evenly unless a column sets a width.
      if (directionChanged) {
        const horizontal = direction.startsWith('row')
        css.add(
          media,
          items,
          horizontal ? {flex: '1 1 0%', 'min-width': '0'} : {flex: '0 0 auto', 'min-width': '0'},
        )
      }
    }

    // --- This column's own width inside its parent row ---
    if (variant === 'column' && parent && parent.layoutType !== 'grid') {
      const parentDirection = directionFor(parent, 'row', device)
      const width = resolve(c.width, device)
      const w = size(width.value ?? undefined, '%', true)
      const clip = num(width.value?.size, 0, 10000) === 0 ? 'hidden' : undefined
      let rule: Declarations | undefined
      if (parentDirection.startsWith('row')) {
        if (w) rule = {flex: `0 1 ${w}`, 'max-width': w, width: 'auto', overflow: clip}
      } else if (w && width.own) {
        // Stacked, a column only narrows if this device asks for it; an
        // inherited desktop width would squeeze it on mobile otherwise.
        rule = {flex: '0 0 auto', width: w, 'max-width': '100%', overflow: clip}
      } else if (prevItemWidth) {
        // Undo a width set at a larger breakpoint.
        rule = {flex: '0 0 auto', width: 'auto', 'max-width': '100%'}
      }
      const signature = rule ? JSON.stringify(rule) : undefined
      if (rule && signature !== prevItemWidth) css.add(media, outer, rule)
      prevItemWidth = signature ?? prevItemWidth
    }
  }

  // --- Visibility ---
  if (visibility?.hideOnDesktop) css.add(VISIBILITY_MEDIA.desktop, outer, {display: 'none !important'})
  if (visibility?.hideOnTablet) css.add(VISIBILITY_MEDIA.tablet, outer, {display: 'none !important'})
  if (visibility?.hideOnMobile) css.add(VISIBILITY_MEDIA.mobile, outer, {display: 'none !important'})

  return css
}

const GRID_WIDTH_MEDIA: Record<Device, string | null> = {
  desktop: '@media (min-width: 768px)',
  tablet: '@media (min-width: 768px) and (max-width: 1024px)',
  mobile: '@media (max-width: 767px)',
}

/**
 * In a grid row, a column's Width replaces its track in the template, so the
 * setting works whether the row is Flexbox, Grid, or a legacy grid row.
 * Columns without a width share the rest. Mobile keeps the stacked single
 * column unless a column sets its own mobile width.
 */
export function buildGridWidthCss(
  input: {
    selector: string
    columns: Array<{key?: string; width?: Responsive<Size>}>
  },
  css: CssBuilder,
): CssBuilder {
  const {selector, columns} = input
  if (columns.length === 0) return css

  for (const device of DEVICES) {
    const resolved = columns.map((col) => resolve(col.width, device))
    const anyWidth = resolved.some((r) => r.value)
    const anyOwn = resolved.some((r) => r.own)
    if (!anyWidth || (device !== 'desktop' && !anyOwn)) continue

    const tracks = resolved.map((r) => size(r.value ?? undefined, '%', true) ?? 'minmax(0, 1fr)')
    css.add(GRID_WIDTH_MEDIA[device], selector, {'grid-template-columns': tracks.join(' ')})

    columns.forEach((col, i) => {
      if (col.key && num(resolved[i].value?.size, 0, 10000) === 0) {
        css.add(GRID_WIDTH_MEDIA[device], `[data-pb="${col.key}"]`, {overflow: 'hidden', 'min-width': '0'})
      }
    })
  }
  return css
}

export {CssBuilder}
