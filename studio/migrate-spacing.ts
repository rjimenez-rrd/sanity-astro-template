import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const SIDES = ['top', 'right', 'bottom', 'left']
const NEW_SUFFIX = ['Tablet', 'Mobile']
const OLD_SUFFIX = ['Md', 'Lg']
const OLD_ONLY = OLD_SUFFIX.flatMap((x) => SIDES.map((s) => `${s}${x}`))

const DRY_RUN = process.argv.includes('--dry')

type Obj = Record<string, unknown>

// Only objects still carrying an old Md/Lg key need converting. Matching on the
// base sides too would make a second run unset the Tablet/Mobile values the
// first run just wrote.
const isSpacing = (v: unknown): v is Obj =>
  Boolean(v) &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v as Obj).some((k) => OLD_ONLY.includes(k))

/**
 * Old model: base applied everywhere, Md overrode at >=768, Lg at >=1024.
 * New model: base IS desktop, Tablet overrides at <=1024, Mobile at <=767.
 * Resolve what each device rendered before, then emit the minimal new fields.
 */
function convert(o: Obj): Obj {
  const out: Obj = {}
  for (const s of SIDES) {
    const base = o[s] as string | undefined
    const md = o[`${s}Md`] as string | undefined
    const lg = o[`${s}Lg`] as string | undefined

    const desktop = lg ?? md ?? base
    const tablet = md ?? base
    const mobile = base

    if (desktop) out[s] = desktop
    const tabletDiffers = Boolean(tablet && tablet !== desktop)
    if (tabletDiffers) out[`${s}Tablet`] = tablet
    const effectiveTablet = tabletDiffers ? tablet : desktop
    if (mobile && mobile !== effectiveTablet) out[`${s}Mobile`] = mobile
  }
  return out
}

/** Surgical patches keyed by document path, so nothing else in the doc is touched. */
function collect(node: unknown, path: string, sets: Obj, unsets: string[]) {
  if (Array.isArray(node)) {
    for (const item of node) {
      const key = (item as Obj)?._key
      if (typeof key === 'string') collect(item, `${path}[_key=="${key}"]`, sets, unsets)
    }
    return
  }
  if (!node || typeof node !== 'object') return

  for (const [k, v] of Object.entries(node as Obj)) {
    const child = `${path}.${k}`
    if (isSpacing(v)) {
      const src = v as Obj
      const next = convert(src)
      console.log(`  ${child}`)
      console.log(`     ${JSON.stringify(src)} -> ${JSON.stringify(next)}`)
      for (const [nk, nv] of Object.entries(next)) sets[`${child}.${nk}`] = nv
      // Clear any new-model key the conversion did not produce, plus all old keys.
      for (const s of SIDES) {
        for (const suf of NEW_SUFFIX) {
          if (!(`${s}${suf}` in next)) unsets.push(`${child}.${s}${suf}`)
        }
        if (!(s in next) && s in src) unsets.push(`${child}.${s}`)
      }
      for (const ok of OLD_ONLY) if (ok in src) unsets.push(`${child}.${ok}`)
    } else {
      collect(v, child, sets, unsets)
    }
  }
}

async function main() {
  const docs = await client.fetch<Array<{_id: string}>>('*[defined(pageBuilder)]{_id}')

  for (const {_id} of docs) {
    const doc = await client.getDocument(_id)
    if (!doc) continue
    const sets: Obj = {}
    const unsets: string[] = []
    console.log(`\n${_id}:`)
    collect(doc.pageBuilder, 'pageBuilder', sets, unsets)

    if (Object.keys(sets).length === 0 && unsets.length === 0) {
      console.log('  (nothing to convert)')
      continue
    }
    if (DRY_RUN) {
      console.log(`  DRY RUN — ${Object.keys(sets).length} set, ${unsets.length} unset`)
      continue
    }
    const res = await client.patch(_id).set(sets).unset(unsets).commit()
    console.log(`  committed, rev ${res._rev}`)
  }
}

main().catch((err) => {
  console.error('FAILED', err.message)
  process.exit(1)
})
