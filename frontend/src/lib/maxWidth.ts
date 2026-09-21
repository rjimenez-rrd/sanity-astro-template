import {stegaClean} from '@sanity/client/stega'

/**
 * Content max-width classes, shared by the hero and the site header so both
 * line up. Edit a width here and every user of it follows.
 */
export const MAX_WIDTH_MAP: Record<string, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-[1360px]',
  wide: 'max-w-[1360px]',
}

/** Class for a Max Width setting; unset or unknown values get the default. */
export function getMaxWidthClass(value?: string | null): string {
  return MAX_WIDTH_MAP[stegaClean(value) || 'default'] ?? MAX_WIDTH_MAP.default
}
