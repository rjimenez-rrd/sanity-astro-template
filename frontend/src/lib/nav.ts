import {stegaClean} from '@sanity/client/stega'
import {DEFAULT_LANGUAGE, OTHER_LANGUAGES, homePath, t, type Alternates, type Language} from '@/lib/i18n'
import type {NavDropdown, SiteSettings} from '@/types/sanity'

/** One Main Navigation item: a plain link or a dropdown. */
export type NavItem = NonNullable<SiteSettings['mainNav']>[number]

export const isDropdown = (item: NavItem): item is NavDropdown =>
  stegaClean(item._type) === 'navDropdown'

const normalize = (path: string) => path.replace(/\/+$/, '') || '/'

/**
 * Which menu items match the page being viewed, so they can stay highlighted
 * in the hover color. Trailing slashes are ignored, and only internal paths
 * can match. Pass Astro.originPathname, not url.pathname: a missing page is
 * rewritten to /404, and the menu should still match the address the visitor
 * actually opened.
 */
export function navMatcher(pathname: string) {
  const currentPath = normalize(pathname)

  const isCurrent = (href?: string | null) => {
    const clean = stegaClean(href)
    return Boolean(clean && clean.startsWith('/') && normalize(clean) === currentPath)
  }

  /**
   * A dropdown is current on its own page and on pages under its path
   * (/practice-areas/…), not merely because one of its links is open: a page
   * like /personal-injury highlights only its own link inside the dropdown.
   */
  const dropdownIsCurrent = (item: NavDropdown) => {
    const own = stegaClean(item.href)
    if (!own?.startsWith('/')) return false
    const base = normalize(own)
    return currentPath === base || (base !== '/' && currentPath.startsWith(`${base}/`))
  }

  return {isCurrent, dropdownIsCurrent}
}

/** Attributes for a current item: aria-current for links, data-current for styling. */
export const currentAttrs = (on: boolean, link = true) =>
  on ? {'data-current': '', ...(link ? {'aria-current': 'page' as const} : {})} : {}

/**
 * The header's extra link, which doubles as the language switch. On an English
 * page it keeps its label ("Spanish") and goes to this page's Spanish version,
 * or to its own link (/es) when there's no translation. On a Spanish page it's
 * the link from Site Settings (Español) — "English" if that's empty — and goes
 * back to the English version, or that link, or the English home.
 *
 * One switch, so from the default language it leads to the first other one.
 */
export function languageLink(
  language: Language,
  alternates: Alternates,
  extraLink: SiteSettings['headerExtraLink'] | undefined,
) {
  if (language === DEFAULT_LANGUAGE) {
    const other = OTHER_LANGUAGES[0]
    return extraLink?.href
      ? {label: extraLink.label, href: alternates[other] ?? extraLink.href, lang: other}
      : undefined
  }
  return {
    label: extraLink?.label || t(language, 'switchToDefault'),
    href: alternates.en ?? extraLink?.href ?? homePath(DEFAULT_LANGUAGE),
    lang: DEFAULT_LANGUAGE,
  }
}
