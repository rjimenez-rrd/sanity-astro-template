import {stegaClean} from '@sanity/client/stega'
import {formatPhoneNumber} from './formatPhoneNumber'

/**
 * The site's phone, from Site Settings → Branding: `phone` is what gets
 * dialed, `phoneText` the Main Phone Text (e.g. (833) SANDERS) and
 * `phoneTexts` the More Phone Texts, picked by _key.
 */
export interface PhoneSource {
  phone?: string | null
  phoneText?: string | null
  phoneTexts?: {_key: string; text?: string | null}[] | null
}

/** Saved choices that mean the Main text or the number, old and new. */
const MAIN = new Set(['main', 'display', 'phone'])
const NUMBER = new Set(['number', 'phoneNumber'])

/**
 * The words to show for a saved choice (studio PhoneTextInput): the Main
 * Phone Text by default, the formatted number, e.g. (516) 591-3208, or one of
 * More Phone Texts by _key. An empty or deleted text falls back to the Main
 * text, and an empty Main text to the number.
 */
export function phoneText(source: PhoneSource | null | undefined, choice?: string | null): string {
  const number = formatPhoneNumber(stegaClean(source?.phone))
  const main = source?.phoneText?.trim() || number
  const pick = stegaClean(choice)
  if (!pick || MAIN.has(pick)) return main
  if (NUMBER.has(pick)) return number
  return source?.phoneTexts?.find((t) => stegaClean(t._key) === pick)?.text?.trim() || main
}
