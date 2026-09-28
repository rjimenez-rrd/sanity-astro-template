/**
 * The fonts editors can pick (studio schemaTypes/fonts.ts), each bundled in
 * global.css so none is fetched from Google Fonts, with a fallback in the
 * same style for while it loads.
 */
const SERIF = 'ui-serif, Georgia, serif'
const CONDENSED = 'Impact, sans-serif'

const FONTS: Record<string, string> = {
  Inter: 'var(--font-inter)',
  Montserrat: 'var(--font-montserrat)',
  'Libre Baskerville': `'Libre Baskerville', ${SERIF}`,
  Baskervville: `'Baskervville', ${SERIF}`,
  'Playfair Display': `'Playfair Display', ${SERIF}`,
  Lora: `'Lora', ${SERIF}`,
  'Bebas Neue': `'Bebas Neue', ${CONDENSED}`,
  Oswald: `'Oswald', ${CONDENSED}`,
  Anton: `'Anton', ${CONDENSED}`,
}

/** The CSS font-family for a picked font, or undefined for anything else. */
export function fontStack(name: string | null | undefined): string | undefined {
  return name ? FONTS[name.trim()] : undefined
}
