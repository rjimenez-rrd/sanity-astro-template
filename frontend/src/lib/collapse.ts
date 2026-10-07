/**
 * Smooth open and close for content the browser would otherwise show or hide
 * at once: a <details> panel (Disclosure, so the Accordion and FAQ) or the
 * Table of Contents' list. Animates the element's height — and its vertical
 * padding, which a height of 0 can't remove — with a fade. One timing for
 * all, so everything that expands on the site moves the same way. With
 * prefers-reduced-motion the promise resolves at once and nothing moves.
 *
 * The caller shows the element before expand() and hides it after collapse()
 * resolves.
 */

const OPEN = {duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)'}
const CLOSE = {duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)'}

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The element at its natural size: what expand() grows to and collapse() shrinks from. */
function fullSize(el: HTMLElement) {
  const style = getComputedStyle(el)
  return {height: `${el.getBoundingClientRect().height}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, opacity: 1}
}

const closedSize = {height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0}

async function run(el: HTMLElement, keyframes: Keyframe[], timing: KeyframeAnimationOptions) {
  if (reduceMotion()) return
  const overflow = el.style.overflow
  el.style.overflow = 'hidden'
  try {
    await el.animate(keyframes, timing).finished
  } catch {
    // Cancelled (the element was removed or re-animated): leave it as it is.
  } finally {
    el.style.overflow = overflow
  }
}

/** Grow a just-shown element from nothing to its full size. */
export function expand(el: HTMLElement): Promise<void> {
  return run(el, [closedSize, fullSize(el)], OPEN)
}

/** Shrink a shown element to nothing; hide it once this resolves. */
export function collapse(el: HTMLElement): Promise<void> {
  return run(el, [fullSize(el), closedSize], CLOSE)
}
