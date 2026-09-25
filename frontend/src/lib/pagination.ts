/**
 * Numbered pagination for a card list placed on a builder page.
 *
 * Pages are real paths — /practice-areas, /practice-areas/page/2 — not
 * ?page=2: Vercel's ISR cache ignores the query string, so ?page=2 would be
 * served the cached first page. Page 1 is the page's own URL.
 *
 * No path aliases and no Astro imports, so this runs under plain Node too.
 */

export const DEFAULT_PER_PAGE = 10
const MAX_PER_PAGE = 48

/** Cards per page as saved in the Studio, clamped to something sane. */
export function perPageOf(raw: unknown): number {
  const n = Math.round(Number(raw))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_PER_PAGE) : DEFAULT_PER_PAGE
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, perPage)))
}

/** The page's own URL: /practice-areas/page/3 -> /practice-areas. */
export function listBasePath(pathname: string): string {
  const base = pathname.replace(/\/page\/\d+\/?$/, '').replace(/\/$/, '')
  return base || '/'
}

export function listPageHref(base: string, n: number): string {
  if (n <= 1) return base
  return `${base === '/' ? '' : base}/page/${n}`
}

/**
 * Page numbers to show, with 'gap' where a run is skipped:
 * 1 … 4 [5] 6 … 12. Always shows the first, the last, and the current page
 * with one neighbour each side — never more than seven slots.
 */
export function pageRange(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  // Near either end, widen the window so the row keeps a steady length.
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap')
    out.push(p)
  })
  return out
}

type Node = Record<string, unknown>

/**
 * The paginated list on a page, if it has one: the first Practice Area Grid
 * block, found anywhere in the page builder (inside columns and Inner
 * Containers too). One paginated list per page — a second would page in step
 * with the first, since both read the same page number.
 */
export function findPaginatedList(sections: unknown): {items: number; perPage: number} | undefined {
  let found: {items: number; perPage: number} | undefined
  const walk = (node: unknown) => {
    if (found || !node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(walk)
    const n = node as Node
    if (n._type === 'practiceAreaGrid') {
      const items = Array.isArray(n.practiceAreas) ? n.practiceAreas.filter(Boolean).length : 0
      found = {items, perPage: perPageOf(n.perPage)}
      return
    }
    Object.values(n).forEach(walk)
  }
  walk(sections)
  return found
}
