/**
 * Scopes an editor's Custom CSS to one element.
 *
 * The result is injected into a `<style>` tag, so two things have to hold: it
 * must not be able to close that tag, and it must not be able to style anything
 * outside the element it was written for. Rather than sanitising a string, this
 * tokenises the input and rebuilds it — anything unrecognised is dropped, so a
 * construct this parser does not understand can never reach the page.
 */

/** Rejected outright: no way for these to appear in a legitimate declaration. */
const FORBIDDEN = /<\/|<!--|@import|@charset|javascript:|expression\s*\(|\\3c|\\00003c/i

/** A declaration body: property names, values, and the punctuation they need. */
const SAFE_DECLARATIONS = /^[a-zA-Z0-9\s\-_#().,%/'"!:;+*>=[\]&$@]*$/

/** Selectors may not escape the element, so no commas at top level and no :root/html/body. */
const UNSAFE_SELECTOR = /[{}]|:root\b|\bhtml\b|\bbody\b/i

const MAX_LENGTH = 4000

type Rule = {selector: string | null; body: string}

/** Splits `a { b } c { d }` into rules, keeping text before the first brace. */
function parseRules(css: string): Rule[] {
  const rules: Rule[] = []
  let buffer = ''
  let selector = ''
  let depth = 0

  for (const char of css) {
    if (char === '{') {
      depth++
      if (depth === 1) {
        // Everything up to the last `;` is a declaration for the element
        // itself; only the remainder is this block's selector. Without this
        // split, `color: red; &:hover { … }` treats the whole line as a
        // selector and the first declaration silently escapes its scope.
        const lastSemicolon = buffer.lastIndexOf(';')
        if (lastSemicolon !== -1) {
          const leading = buffer.slice(0, lastSemicolon + 1).trim()
          if (leading) rules.push({selector: null, body: leading})
          selector = buffer.slice(lastSemicolon + 1).trim()
        } else {
          selector = buffer.trim()
        }
        buffer = ''
        continue
      }
    }
    if (char === '}') {
      depth--
      if (depth === 0) {
        rules.push({selector, body: buffer})
        buffer = ''
        selector = ''
        continue
      }
      if (depth < 0) return []
    }
    buffer += char
  }

  if (depth !== 0) return []
  // Trailing text outside any block is a bare declaration list for the element.
  if (buffer.trim()) rules.push({selector: null, body: buffer})
  return rules
}

/**
 * `&:hover` → `SEL:hover`; `.child` → `SEL .child`. `selector` is Elementor's
 * word for the element itself, so `selector:hover` and `selector .child` work
 * the same as `&:hover` and `& .child` (no HTML element is called selector).
 */
function scopeSelector(selector: string, scope: string): string | undefined {
  const parts = selector
    .replace(/(^|[^\w-])selector(?![\w-])/g, '$1&')
    .split(',')
    .map((s) => s.trim())
  const scoped: string[] = []

  for (const part of parts) {
    if (!part || UNSAFE_SELECTOR.test(part)) return undefined
    scoped.push(part.includes('&') ? part.replaceAll('&', scope) : `${scope} ${part}`)
  }
  return scoped.join(',')
}

function cleanBody(body: string): string | undefined {
  const trimmed = body.trim()
  if (!trimmed) return undefined
  if (!SAFE_DECLARATIONS.test(trimmed)) return undefined
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`
}

/**
 * Returns CSS text scoped to `scope`, or undefined if the input is empty or
 * contains anything this parser cannot vouch for.
 */
export function scopeCustomCss(raw: string | null | undefined, scope: string): string | undefined {
  const css = raw?.trim()
  if (!css || css.length > MAX_LENGTH || FORBIDDEN.test(css)) return undefined

  const rules = parseRules(css)
  if (rules.length === 0) return undefined

  const out: string[] = []

  for (const {selector, body} of rules) {
    // A media query keeps its condition and scopes the rules inside it.
    if (selector?.startsWith('@media')) {
      if (UNSAFE_SELECTOR.test(selector.slice(6))) return undefined
      const inner = parseRules(body)
      const nested: string[] = []
      for (const rule of inner) {
        const declarations = cleanBody(rule.body)
        if (!declarations) continue
        const target = rule.selector ? scopeSelector(rule.selector, scope) : scope
        if (!target) return undefined
        nested.push(`${target}{${declarations}}`)
      }
      if (nested.length > 0) out.push(`${selector}{${nested.join('')}}`)
      continue
    }

    if (selector?.startsWith('@')) return undefined

    const declarations = cleanBody(body)
    if (!declarations) continue
    const target = selector ? scopeSelector(selector, scope) : scope
    if (!target) return undefined
    out.push(`${target}{${declarations}}`)
  }

  return out.length > 0 ? out.join('') : undefined
}
