/**
 * Every dev-only page: where it's served, its file in src/dev/, and how the
 * /dev index lists it. astro.config.mjs registers these routes under
 * `astro dev` only, and dev/index.astro draws its links from the same list,
 * so adding a page here does both.
 *
 * @typedef {object} DevPage
 * @property {string} pattern Route pattern, as Astro's injectRoute takes it.
 * @property {string} file The page's file, relative to src/dev/.
 * @property {string} [href] Where the index links to, when the pattern has a parameter.
 * @property {string} title
 * @property {string} description
 * @property {'tool' | 'preview'} kind
 */

/** @type {DevPage[]} */
export const DEV_PAGES = [
  {
    pattern: '/dev/codebase-map',
    file: 'codebase-map.astro',
    title: 'Codebase Map',
    description: 'Where things live, how a page renders, and which file to open for a given change.',
    kind: 'tool',
  },
  {
    pattern: '/dev/preview/buttons',
    file: 'preview/buttons.astro',
    title: 'Buttons',
    description: 'The Button block’s Normal and Hover colors, one button per case the Colors tabs can produce.',
    kind: 'preview',
  },
  {
    pattern: '/dev/preview/case-results',
    file: 'preview/case-results.astro',
    title: 'Case Results',
    description: 'The Case Results block with sample results, no Case Result documents needed.',
    kind: 'preview',
  },
  {
    pattern: '/dev/preview/fill',
    file: 'preview/fill.astro',
    title: 'Fill column height',
    description: 'Size & Alignment → Height → Fill column, in a two-column row with media beside taller text.',
    kind: 'preview',
  },
  {
    pattern: '/dev/preview/link-list',
    file: 'preview/link-list.astro',
    title: 'Link List',
    description: 'The Link List block, with the current page’s link highlighted.',
    kind: 'preview',
  },
  {
    pattern: '/dev/preview/practice-areas-grid/[...page]',
    href: '/dev/preview/practice-areas-grid',
    file: 'preview/practice-areas-grid/[...page].astro',
    title: 'Practice Areas grid',
    description: 'The Practice Area Grid block with 23 sample areas, 10 per page, so pagination has three pages.',
    kind: 'preview',
  },
  {
    pattern: '/dev/preview/testimonial-carousel',
    file: 'preview/testimonial-carousel.astro',
    title: 'Testimonial Carousel',
    description: 'The Testimonial Carousel block with sample reviews.',
    kind: 'preview',
  },
]
