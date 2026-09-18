import {stegaClean} from '@sanity/client/stega'

export interface MotionSettings {
  animation?: string | null
  duration?: string | null
  delay?: number | null
}

const ANIMATIONS = new Set(['fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn'])
const DURATIONS = new Set(['slow', 'normal', 'fast'])

/**
 * Data attributes that opt an element into an entrance animation, or nothing
 * when none is set — so un-animated elements carry no extra markup.
 */
export function animationAttrs(motion: MotionSettings | null | undefined): Record<string, string> {
  const m = motion ? (stegaClean(motion) as MotionSettings) : undefined
  const animation = m?.animation
  if (!animation || !ANIMATIONS.has(animation)) return {}

  const attrs: Record<string, string> = {'data-animate': animation}
  if (m?.duration && DURATIONS.has(m.duration) && m.duration !== 'normal') {
    attrs['data-animate-duration'] = m.duration
  }
  const delay = typeof m?.delay === 'number' && Number.isFinite(m.delay) ? Math.round(m.delay) : 0
  if (delay > 0) attrs['data-animate-delay'] = String(Math.min(delay, 10000))
  return attrs
}
