import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const DRY_RUN = process.argv.includes('--dry')

type Obj = Record<string, any>

/**
 * Converts gridRows saved before the container settings into container rows,
 * preserving how they render today.
 *
 * The legacy fields were Tailwind class names; the numbers below are those
 * classes resolved to pixels, with Tailwind's `md:` (>=768px) value becoming the
 * desktop base and the unprefixed value becoming the mobile override — which is
 * the desktop-first model the container settings use.
 */

/** GAP_MAP: [mobile, desktop] in px. */
const GAP: Record<string, [number, number]> = {
  none: [0, 0],
  sm: [8, 16],
  md: [16, 24],
  lg: [24, 32],
  xl: [32, 48],
}

/** PADDING_Y_MAP: [mobile, desktop] in px. */
const PADDING_Y: Record<string, [number, number]> = {
  none: [0, 0],
  sm: [16, 24],
  md: [32, 48],
  lg: [48, 64],
  xl: [64, 96],
}

/** MAX_WIDTH_MAP: px, or null for an unconstrained row. */
const MAX_WIDTH: Record<string, number | null> = {
  none: null,
  narrow: 1280,
  default: 1520,
  wide: 1600,
  full: null,
}

/** VALIGN_MAP was align-self on the column; a container column uses justifyContent. */
const VALIGN: Record<string, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
}

function buildContainer(row: Obj) {
  const container: Obj = {
    // Legacy rows rendered as a CSS grid, and Grid mode collapses to one column
    // on mobile exactly as those presets did.
    layoutType: 'grid',
  }

  const maxWidth = MAX_WIDTH[row.maxWidth ?? 'none']
  if (maxWidth) {
    container.contentWidth = 'boxed'
    container.width = {desktop: {size: maxWidth, unit: 'px'}}
  } else {
    container.contentWidth = 'full'
  }

  const [gapMobile, gapDesktop] = GAP[row.gap ?? 'md'] ?? GAP.md
  container.gap = {
    linked: true,
    desktop: {column: gapDesktop, row: gapDesktop, unit: 'px'},
    mobile: {column: gapMobile, row: gapMobile, unit: 'px'},
  }

  return container
}

function buildPadding(row: Obj): Obj | undefined {
  const [mobile, desktop] = PADDING_Y[row.paddingY ?? 'none'] ?? PADDING_Y.none
  if (!desktop && !mobile) return undefined

  const padding: Obj = {}
  if (desktop) {
    padding.top = `${desktop}px`
    padding.bottom = `${desktop}px`
  }
  // Only worth storing when it differs from the base it would otherwise inherit.
  if (mobile !== desktop) {
    padding.topMobile = `${mobile}px`
    padding.bottomMobile = `${mobile}px`
  }
  return padding
}

const LEGACY_ROW_FIELDS = ['gap', 'paddingY', 'maxWidth', 'reverseOnMobile']

async function main() {
  const docs = await client.fetch<Array<{_id: string}>>('*[defined(pageBuilder)]{_id}')

  for (const {_id} of docs) {
    const doc = await client.getDocument(_id)
    const rows = (doc?.pageBuilder ?? []) as Obj[]

    const sets: Obj = {}
    const unsets: string[] = []
    let converted = 0

    for (const row of rows) {
      // Only containers (gridRow) have a container field.
      if (row?._type !== 'gridRow' || !row._key) continue

      const base = `pageBuilder[_key=="${row._key}"]`

      /**
       * A row that already had container settings was never rendered through the
       * legacy path, but may still carry the old fields from before it was
       * converted. Those keys no longer exist in the schema, so the Studio would
       * report them as unknown — strip them without touching anything else.
       */
      if (row.container) {
        let orphans = 0
        for (const field of LEGACY_ROW_FIELDS) {
          if (field in row) {
            unsets.push(`${base}.${field}`)
            orphans++
          }
        }
        for (const col of (row.columns ?? []) as Obj[]) {
          if (col?._key && 'verticalAlign' in col) {
            unsets.push(`${base}.columns[_key=="${col._key}"].verticalAlign`)
            orphans++
          }
        }
        if (orphans > 0) {
          converted++
          console.log(`  ${base}`)
          console.log(`     already a container — stripping ${orphans} orphaned legacy field(s)`)
        }
        continue
      }
      sets[`${base}.container`] = buildContainer(row)

      const padding = buildPadding(row)
      if (padding) sets[`${base}.advanced.padding`] = padding

      for (const field of LEGACY_ROW_FIELDS) {
        if (field in row) unsets.push(`${base}.${field}`)
      }

      for (const col of (row.columns ?? []) as Obj[]) {
        if (!col?._key) continue
        const colBase = `${base}.columns[_key=="${col._key}"]`

        if (!col.container) {
          const colContainer: Obj = {layoutType: 'flex', direction: {desktop: 'column'}}
          // 'top' is already the rendered default, so it needs nothing stored.
          const justify = VALIGN[col.verticalAlign ?? 'top']
          if (justify && col.verticalAlign && col.verticalAlign !== 'top') {
            colContainer.justifyContent = {desktop: justify}
          }
          sets[`${colBase}.container`] = colContainer
        }
        if ('verticalAlign' in col) unsets.push(`${colBase}.verticalAlign`)
      }

      converted++
      console.log(`  ${base}`)
      console.log(
        `     gap:${row.gap ?? '—'} paddingY:${row.paddingY ?? '—'} maxWidth:${row.maxWidth ?? '—'} → container + advanced.padding`,
      )
    }

    if (converted === 0) continue

    console.log(`${_id}: ${converted} legacy row(s)`)
    if (DRY_RUN) {
      console.log(`  DRY RUN — ${Object.keys(sets).length} set, ${unsets.length} unset\n`)
      continue
    }
    const res = await client.patch(_id).set(sets).unset(unsets).commit()
    console.log(`  committed, rev ${res._rev}\n`)
  }
}

main().catch((err) => {
  console.error('FAILED', err.message)
  process.exit(1)
})
