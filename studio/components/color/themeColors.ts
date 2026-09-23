import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

/**
 * The site's Theme colors, offered as swatches in every color picker so a
 * block can be set to a brand color without anyone retyping a hex.
 */
export interface ThemeSwatch {
  label: string
  value: string
}

const FIELDS: Array<[string, string]> = [
  ['primary', 'Primary'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['foreground', 'Text'],
  ['background', 'Background'],
  ['muted', 'Muted'],
  ['border', 'Border'],
]

/**
 * The draft first: Site Settings usually has unpublished edits, and colors
 * typed there should be pickable straight away rather than only after a
 * publish.
 */
const QUERY =
  'coalesce(*[_id == "drafts.siteSettings"][0].theme, *[_id == "siteSettings"][0].theme)'

type Theme = Record<string, unknown> | null

// Shared across every picker on the page — otherwise each one fires the same
// request. Short-lived, so colors saved a moment ago show up without a reload.
const TTL = 30_000
let cache: {at: number; theme: Theme} | null = null
let inflight: Promise<Theme> | null = null

function load(client: {fetch: <T>(q: string) => Promise<T>}): Promise<Theme> {
  if (cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.theme)
  if (!inflight) {
    inflight = client
      .fetch<Theme>(QUERY)
      .then((theme) => {
        cache = {at: Date.now(), theme}
        return theme
      })
      // A failed fetch just means no swatches — never a broken picker.
      .catch(() => null)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** `enabled` defers the fetch until the picker is actually opened. */
export function useThemeColors(enabled = true): ThemeSwatch[] {
  const client = useClient({apiVersion: '2024-10-01'})
  const [swatches, setSwatches] = useState<ThemeSwatch[]>([])

  useEffect(() => {
    if (!enabled) return
    let alive = true
    load(client).then((theme) => {
      if (!alive || !theme) return
      setSwatches(
        FIELDS.flatMap(([key, label]) => {
          const raw = theme[key]
          const value = typeof raw === 'string' ? raw.trim() : ''
          return value ? [{label, value}] : []
        }),
      )
    })
    return () => {
      alive = false
    }
  }, [client, enabled])

  return swatches
}
