/**
 * What BlockRenderer needs to know about one block before drawing it: its
 * final styles, the CSS scoped to it, and the markers global.css reads.
 * Pure functions, so each step can be read (and tested) on its own.
 */
import {stegaClean} from '@sanity/client/stega'
import {buildStyles, type BlockStyles} from './blockStyles'
import type {MotionSettings} from './animation'
import {CssBuilder, MEDIA, VISIBILITY_MEDIA, resolve, safeCssClasses, safeCssId, type VisibilitySettings} from './container'
import {buildAdvancedCss, parseAttributes} from './advancedCss'
import {DEVICES} from './cssValues'
import {buildDesignCss, type DesignSettings} from './design'
import {clean, mergeStyles, type ContainerAdvanced} from './containerStyles'
import {fullWidthDevices} from './fullWidth'
import {scopeCustomCss} from './customCss'

export type ResolvedStyles = (BlockStyles & {motion?: MotionSettings}) | null

/**
 * The Container-style tabs some blocks have (e.g. Image): Style (`design`),
 * Advanced and Visibility. Absent on blocks with only Block Styles.
 */
export interface BlockTabs {
  design?: DesignSettings | null
  advanced?: ContainerAdvanced | null
  visibility?: VisibilitySettings | null
}

export function blockTabs(block: unknown): BlockTabs {
  const tabs = block as BlockTabs
  return {design: clean(tabs.design), advanced: clean(tabs.advanced), visibility: clean(tabs.visibility)}
}

// --- Styles --------------------------------------------------------------------

/**
 * A block's final Block Styles: its tabs merged in, then the defaults some
 * types get (a map filling its row's height, a button's per-device Full Width).
 */
export function resolveBlockStyles(
  block: {blockStyles?: unknown},
  type: string,
  tabs: BlockTabs,
  columnCount: number | undefined,
): ResolvedStyles {
  // Advanced padding/margin and the Style panel's background and border take
  // over from the older Block Styles, as they do on a Container. Blocks
  // without tabs keep Block Styles as they are.
  const merged = (
    tabs.advanced || tabs.design
      ? mergeStyles(block.blockStyles, tabs.advanced, tabs.design)
      : stegaClean(block.blockStyles)
  ) as ResolvedStyles
  const filled = withDefaultFill(merged, type, columnCount)
  return type === 'callToAction' ? withFullWidth(filled, fullWidthDevices(block)) : filled
}

/**
 * These types default to matching the tallest column in their row instead of
 * their own natural/preset height — a map (or similar embed) sitting beside an
 * image or text column should fill it without an editor opening Size &
 * Alignment and picking "Fill column" every time. An explicit height, on
 * either the block itself or here, always wins over this default.
 * Gated on having a sibling column: with only one column in the row, "fill"
 * has no taller sibling to measure against and the block collapses to zero
 * height (the same reason global.css reverts it on mobile — see there).
 */
const DEFAULT_FILL_TYPES = new Set(['mapEmbed'])

function withDefaultFill(styles: ResolvedStyles, type: string, columnCount: number | undefined): ResolvedStyles {
  const fills = DEFAULT_FILL_TYPES.has(type) && (columnCount ?? 1) > 1 && !styles?.size?.height
  return fills ? ({...styles, size: {...styles?.size, height: 'fill'}} as ResolvedStyles) : styles
}

/**
 * Full Width on a Button means the width of its column on the devices checked,
 * so a width set in Size & Alignment gives way there. The button fills its
 * wrapper, so leaving a 200px width on it would have it fill 200px and
 * quietly contradict the checkbox.
 *
 * Each device's width on its own first (tablet inherits desktop, mobile
 * inherits tablet), then 100% where Full Width is checked. Written back
 * desktop-first, a smaller device only where it differs from the one above,
 * since the tablet rule also applies on mobile. Without resolving first, a
 * full desktop dropped the width tablet/mobile inherit, and a full tablet's
 * 100% leaked into mobile.
 */
function withFullWidth(styles: ResolvedStyles, devices: string[]): ResolvedStyles {
  const size = styles?.size
  if (devices.length === 0 || !size) return styles
  const own = {
    desktop: size.width || null,
    tablet: size.widthTablet || size.width || null,
    mobile: size.widthMobile || size.widthTablet || size.width || null,
  }
  if (!own.desktop && !own.tablet && !own.mobile) return styles
  const full = new Set(devices)
  const at = (device: keyof typeof own) => (full.has(device) ? '100%' : own[device])
  const desktop = at('desktop')
  const tablet = at('tablet')
  const mobile = at('mobile')
  return {
    ...styles,
    size: {
      ...size,
      width: desktop,
      widthTablet: tablet !== desktop ? (tablet ?? 'auto') : null,
      widthMobile: mobile !== tablet ? (mobile ?? 'auto') : null,
    },
  } as ResolvedStyles
}

// --- Hooks and scoped CSS ------------------------------------------------------

export interface BlockCss {
  cssId?: string
  cssClasses?: string
  /** Advanced -> Attributes, checked (advancedCss.ts parseAttributes). */
  attributes: Record<string, string>
  /** Everything scoped to this block, for one <style>: generated rules, then Custom CSS. */
  css?: string
}

/**
 * The block's CSS ID, classes, attributes and scoped CSS. The Advanced tab
 * wins over Block Styles for the ID and classes, as on a Container; both
 * Custom CSS boxes apply. Everything is scoped to this block's key, so a rule
 * an editor writes can only reach this element and its descendants.
 */
export function blockCss(blockKey: string | undefined, styles: ResolvedStyles, tabs: BlockTabs): BlockCss {
  const cssId = safeCssId(tabs.advanced?.cssId ?? styles?.cssId)
  const cssClasses = safeCssClasses(tabs.advanced?.cssClasses ?? styles?.cssClasses)
  const attributes = parseAttributes(tabs.advanced?.attributes)
  if (!blockKey) return {cssId, cssClasses, attributes}

  const self = `[data-pb="${blockKey}"]`
  const custom = [styles?.customCss, tabs.advanced?.customCss]
    .map((raw) => scopeCustomCss(raw, self))
    .filter(Boolean)
    .join('')
  const generated = tabCss(blockKey, tabs)
  // Generated rules first, then the editor's Custom CSS, so it wins.
  return {cssId, cssClasses, attributes, css: generated || custom ? generated + custom : undefined}
}

/**
 * The Style panel, the Advanced tab's layout settings (Align Self, Size,
 * Position, Transform, Order, Z-Index) and Visibility, as rules scoped to the
 * block — the same ones a Container's column gets.
 */
function tabCss(blockKey: string, {design, advanced, visibility}: BlockTabs): string {
  const css = new CssBuilder()
  const self = `[data-pb="${blockKey}"]`
  buildDesignCss(blockKey, design, css, {radiusVar: true})
  // Z-Index before Position, as for a container: its position:relative is
  // only a default, and Advanced -> Position (absolute/fixed) must replace it.
  if (typeof advanced?.zIndex === 'number' && Number.isFinite(advanced.zIndex)) {
    const z = Math.round(Math.min(9999, Math.max(-9999, advanced.zIndex)))
    css.add(null, self, {position: 'relative', 'z-index': String(z)})
  }
  buildAdvancedCss(blockKey, advanced, css)
  for (const device of DEVICES) {
    const order = resolve(advanced?.order, device)
    if (order.own && typeof order.value === 'number' && Number.isFinite(order.value)) {
      css.add(MEDIA[device], self, {order: String(Math.round(Math.min(99, Math.max(-99, order.value))))})
    }
  }
  if (visibility?.hideOnDesktop) css.add(VISIBILITY_MEDIA.desktop, self, {display: 'none !important'})
  if (visibility?.hideOnTablet) css.add(VISIBILITY_MEDIA.tablet, self, {display: 'none !important'})
  if (visibility?.hideOnMobile) css.add(VISIBILITY_MEDIA.mobile, self, {display: 'none !important'})
  return css.toString()
}

// --- Layout markers ------------------------------------------------------------

export type LayoutMarkers = Record<
  'data-pb-pad' | 'data-pb-mar' | 'data-pb-hfont' | 'data-pb-fs' | 'data-pb-w' | 'data-pb-h',
  string | undefined
>

/**
 * Attributes global.css reads to adapt a block to what an editor set. Keyed
 * off what buildStyles actually emitted, not the raw field values: a value
 * the whitelist rejects must not strip the block's default and leave nothing
 * in its place. (buildStyles assigns every key up front, leaving undefined
 * ones for toStyleString to filter, so the value is checked, not just the key.)
 */
export function layoutMarkers(styles: ResolvedStyles): LayoutMarkers {
  const built = buildStyles(styles)
  const emitted = (re: RegExp) =>
    Object.entries(built).some(([k, v]) => v !== undefined && v !== '' && re.test(k))
  const flag = (on: boolean) => (on ? '' : undefined)

  /**
   * Blocks ship their own spacing — AlertNotice p-4, PricingCard p-6, headings
   * mb-4. Configured spacing replaces that instead of nesting outside it:
   * these markers let global.css zero the built-in value, and the configured
   * one then wins as an inline style. Only when an editor set something, so
   * an untouched block keeps its defaults.
   */
  const padding = emitted(/^(padding-|--p[trbl]-(tablet|mobile)$)/)
  const margin = emitted(/^(margin-|--m[trbl]-(tablet|mobile)$)/)
  // Typography -> Heading Font: global.css sets the block's headings to it.
  const headingFont = emitted(/^--pb-heading-font$/)
  // Typography -> Size: global.css sizes a Rich Text block's headings and
  // paragraphs to it.
  const fontSize = emitted(/^(font-size|--fs-(tablet|mobile))$/)

  /**
   * Size & Alignment -> Width: the largest device it applies from. A width
   * carries down (desktop's also applies on tablet and mobile), so this is
   * where it starts; global.css only stops the row sharing its space from
   * that breakpoint down, so a mobile-only width leaves the desktop layout
   * alone.
   */
  const widthFrom = emitted(/^width$/)
    ? 'desktop'
    : emitted(/^--w-tablet$/)
      ? 'tablet'
      : emitted(/^--w-mobile$/)
        ? 'mobile'
        : undefined

  /**
   * A configured height sizes the wrapper, but an image or iframe inside it
   * keeps its own intrinsic height and overflows. This marker lets global.css
   * hand the height down the chain — a wrapper is the only place it can be
   * done, since an inline style cannot reach a descendant. Covers both a fixed
   * height and "fill", which emits `flex` rather than `height`; 'fill' is
   * marked apart so the mobile rule can undo it.
   */
  const fill = built['flex'] === '1 1 auto'
  const height = emitted(/^(height|--h-(tablet|mobile)|--fill-(tablet|mobile))$/) || fill

  return {
    'data-pb-pad': flag(padding),
    'data-pb-mar': flag(margin),
    'data-pb-hfont': flag(headingFont),
    'data-pb-fs': flag(fontSize),
    'data-pb-w': widthFrom,
    'data-pb-h': height ? (fill ? 'fill' : '') : undefined,
  }
}
