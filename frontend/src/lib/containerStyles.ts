/**
 * Assembles the whole stylesheet for one container.
 *
 * `container.ts` holds the primitives — CssBuilder, buildContainerCss,
 * buildGridWidthCss — and this is the glue that decides what to feed them and
 * in what order. It lived in the container component, where it could only be
 * exercised by rendering a page; it is pure, so it belongs here instead.
 *
 * Order matters: generated rules first, then the editor's own Custom CSS, so
 * an override wins at equal specificity.
 */
import {stegaClean} from '@sanity/client/stega'
import {
  CssBuilder,
  buildContainerCss,
  buildGridWidthCss,
  type ContainerSettings,
  type VisibilitySettings,
} from './container'
import {buildDesignCss, type DesignSettings} from './design'
import {scopeCustomCss} from './customCss'
import type {BlockStyles} from './blockStyles'

/** The Advanced tab of a container or one of its columns. */
export interface ContainerAdvanced {
  padding?: BlockStyles['padding']
  margin?: BlockStyles['margin']
  zIndex?: number | null
  cssId?: string | null
  cssClasses?: string | null
  customCss?: string | null
  motion?: unknown
}

/**
 * Draft content carries stega-encoded invisible characters. Anything heading
 * for a CSS value or an attribute has to have them removed first.
 */
export const clean = <T,>(value: T): T => (value ? (stegaClean(value) as T) : value)

/** One column, already mapped by the component. */
export interface ContainerStylesColumn {
  key?: string
  container?: ContainerSettings
  design?: DesignSettings | null
  visibility?: VisibilitySettings | null
  zIndex?: number | null
  /** Uncleaned — the Advanced tab, for its Custom CSS box. */
  advanced?: ContainerAdvanced | null
  /** Uncleaned — the Style tab's shared Block Styles panel. */
  blockStyles?: unknown
}

export interface ContainerStylesInput {
  key?: string
  container?: ContainerSettings
  /** The grid template preset, uncleaned. */
  layout?: string | null
  design?: DesignSettings | null
  visibility?: VisibilitySettings | null
  advanced?: ContainerAdvanced | null
  blockStyles?: unknown
  columns: ContainerStylesColumn[]
}

/**
 * A container has two Custom CSS boxes — the Advanced tab, and the one in
 * Style -> Typography & Effects (the shared Block Styles panel) — so both are
 * honored, each scoped to the element it was written for.
 */
function scopedCss(
  key: string | undefined,
  advanced: ContainerAdvanced | null | undefined,
  blockStyles: unknown,
): Array<string | undefined> {
  if (!key) return []
  return [advanced?.customCss, (clean(blockStyles) as BlockStyles | null)?.customCss].map((raw) =>
    scopeCustomCss(raw, `[data-pb="${key}"]`),
  )
}

export function buildContainerStyles(input: ContainerStylesInput): string {
  const {key: rowKey, container: rowContainer, columns} = input
  const css = new CssBuilder()

  if (rowKey) {
    buildContainerCss(
      {
        key: rowKey,
        variant: 'row',
        container: rowContainer,
        gridTemplate: stegaClean(input.layout),
        zIndex: input.advanced?.zIndex,
        visibility: clean(input.visibility),
      },
      css,
    )
  }

  for (const col of columns) {
    // Columns saved before the container settings have nothing to emit.
    if (!col.key || (!col.container && !col.visibility && col.zIndex == null)) continue
    buildContainerCss(
      {
        key: col.key,
        variant: 'column',
        container: col.container ?? {},
        zIndex: col.zIndex,
        visibility: col.visibility,
        // Widths only apply inside a flex container row.
        parent: rowContainer,
      },
      css,
    )
  }

  // Style tab (background, overlay, border) for the row and each column.
  const rowDesign = clean(input.design)
  if (rowKey) buildDesignCss(rowKey, rowDesign, css)
  for (const col of columns) if (col.key) buildDesignCss(col.key, col.design, css)

  // In Grid mode the preset defines the row's tracks.
  if (rowContainer?.layoutType === 'grid') {
    buildGridWidthCss(
      {
        selector: `[data-pb-inner="${rowKey}"]`,
        columns: columns.map((col) => ({key: col.key, width: col.container?.width})),
      },
      css,
    )
  }

  const customCssRules = [
    ...scopedCss(rowKey, clean(input.advanced) ?? null, input.blockStyles),
    ...columns.flatMap((col) => scopedCss(col.key, clean(col.advanced) ?? null, col.blockStyles)),
  ].filter(Boolean)

  return css.toString() + customCssRules.join('')
}
