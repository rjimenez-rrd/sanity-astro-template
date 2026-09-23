/**
 * Site Settings -> Theme, turned into the CSS variables global.css already
 * defines. Every Tailwind utility in the project resolves through those
 * variables, so overriding them on :root restyles the whole site without any
 * component knowing a theme exists.
 */

export interface ThemeSettings {
  primary?: string | null
  secondary?: string | null
  accent?: string | null
  foreground?: string | null
  background?: string | null
  muted?: string | null
  border?: string | null
  headingFont?: string | null
  bodyFont?: string | null
}

/** Editor input, so only a hex, rgb()/rgba() or a bare keyword reaches CSS. */
const CSS_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%/]+\)|[a-zA-Z]+)$/

/** Google family names: letters, digits, spaces. Nothing that can break out. */
const FONT_NAME = /^[A-Za-z0-9][A-Za-z0-9 ]{0,49}$/

const COLOR_VARS: Array<[keyof ThemeSettings, string]> = [
  ['primary', '--primary'],
  ['secondary', '--secondary'],
  ['accent', '--accent'],
  ['foreground', '--foreground'],
  ['background', '--background'],
  ['muted', '--muted'],
  ['border', '--border'],
]

const color = (raw?: string | null): string | undefined => {
  const v = raw?.trim()
  return v && CSS_COLOR.test(v) ? v : undefined
}

export const fontName = (raw?: string | null): string | undefined => {
  const v = raw?.trim()
  return v && FONT_NAME.test(v) ? v : undefined
}

/**
 * One Google Fonts request for both families, or undefined when neither is
 * set and the bundled Inter/Montserrat stay in use.
 */
export function googleFontsHref(theme: ThemeSettings | null | undefined): string | undefined {
  const families = [fontName(theme?.headingFont), fontName(theme?.bodyFont)]
    .filter((name, i, all): name is string => Boolean(name) && all.indexOf(name) === i)
    .map((name) => `family=${name.replace(/ /g, '+')}:wght@400;500;600;700`)
  if (families.length === 0) return undefined
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

/** The `:root { … }` block, or undefined when the theme sets nothing. */
export function themeCss(theme: ThemeSettings | null | undefined): string | undefined {
  if (!theme) return undefined

  const declarations: string[] = []
  for (const [key, cssVar] of COLOR_VARS) {
    const value = color(theme[key] as string | undefined)
    if (value) declarations.push(`${cssVar}:${value}`)
  }

  // A fallback stack keeps text readable while the webfont loads, and if it
  // fails to load at all.
  const heading = fontName(theme.headingFont)
  const body = fontName(theme.bodyFont)
  if (heading) declarations.push(`--font-montserrat:'${heading}', ui-sans-serif, system-ui, sans-serif`)
  if (body) declarations.push(`--font-inter:'${body}', ui-sans-serif, system-ui, sans-serif`)

  return declarations.length > 0 ? `:root{${declarations.join(';')}}` : undefined
}
