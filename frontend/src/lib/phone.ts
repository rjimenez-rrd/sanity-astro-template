import {stegaClean} from '@sanity/client/stega'
import {formatPhoneNumber} from './formatPhoneNumber'

/**
 * The site's phone, from Site Settings → Branding: `phone` is what gets
 * dialed, `phoneText` how it reads (e.g. (833) SANDERS).
 */
export interface PhoneSource {
  phone?: string | null
  phoneText?: string | null
}

/**
 * The words to show. 'display' is the display text, or the formatted number
 * when there's none; 'number' is always the formatted number, (516) 591-3208.
 */
export function phoneText(source: PhoneSource | null | undefined, show: 'display' | 'number' = 'display'): string {
  const number = formatPhoneNumber(stegaClean(source?.phone))
  if (show === 'number') return number
  return source?.phoneText?.trim() || number
}
