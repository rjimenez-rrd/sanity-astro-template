/**
 * US/NANP phone helpers.
 *
 * Two outputs from one parse:
 *   formatPhoneNumber() -> what a human reads:  (555) 123-4567
 *   toTelHref()         -> what a dialer needs: tel:+15551234567
 *
 * Anything that isn't a NANP number (international, malformed) is passed
 * through untouched rather than mangled.
 */

type Parsed = {
  /** Exactly 10 digits, country code stripped. */
  digits: string
  ext?: string
}

/** Trailing extension: "x89", "ext 89", "ext. 89", "extension 89". */
const EXT_PATTERN = /\s*(?:x|ext\.?|extension)\s*(\d+)\s*$/i

function parse(input: string): Parsed | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const extMatch = trimmed.match(EXT_PATTERN)
  const ext = extMatch?.[1]
  const base = extMatch ? trimmed.slice(0, extMatch.index) : trimmed

  const digits = base.replace(/\D/g, '')

  if (digits.length === 10) return {digits, ext}
  // 11 digits led by the NANP country code — this is the "+1" case.
  if (digits.length === 11 && digits.startsWith('1')) {
    return {digits: digits.slice(1), ext}
  }
  return null
}

/** Human-readable form. Returns '' for empty input, so it's safe to render directly. */
export function formatPhoneNumber(input?: string | null): string {
  if (!input) return ''

  const parsed = parse(input)
  if (!parsed) return input.trim()

  const {digits, ext} = parsed
  const display = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  return ext ? `${display} ext. ${ext}` : display
}

/** `tel:` href in E.164. Extensions use the RFC 3966 `;ext=` parameter. */
export function toTelHref(input?: string | null): string {
  if (!input) return ''

  const parsed = parse(input)
  if (!parsed) {
    // Unknown shape: keep digits and a leading +, drop the rest.
    const raw = input.trim().replace(/(?!^\+)\D/g, '')
    return raw ? `tel:${raw}` : ''
  }

  const {digits, ext} = parsed
  return ext ? `tel:+1${digits};ext=${ext}` : `tel:+1${digits}`
}
