import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

/** The site's phone from Site Settings → Branding. */
export interface PhoneSettings {
  /** What gets dialed. */
  phone?: string
  /** Main Phone Text: the first text, used by the header and footer. */
  main?: string
  /** More Phone Texts, picked by _key. */
  texts: {_key: string; name?: string; text?: string}[]
}

/** Saved choices that mean the Main text or the number, old and new. */
const MAIN = new Set(['main', 'display', 'phone'])
const NUMBER = new Set(['number', 'phoneNumber'])

/** (555) 123-4567 for a 10-digit US number (or +1 and 10); anything else as typed. */
export function formatPhone(raw?: string): string {
  const digits = raw?.replace(/\D/g, '') ?? ''
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : raw?.trim() ?? ''
}

/**
 * The words a phone shows for a saved choice, as the site renders it
 * (frontend lib/phone.ts): the Main text, the number, or one of More Phone
 * Texts by _key. A deleted text falls back to the Main text.
 */
export function phoneChoiceText(settings: PhoneSettings, choice?: string): string {
  const number = formatPhone(settings.phone)
  const main = settings.main?.trim() || number
  if (!choice || MAIN.has(choice)) return main
  if (NUMBER.has(choice)) return number
  return settings.texts.find((t) => t._key === choice)?.text?.trim() || main
}

/** One Site Settings read shared by every phone input and chip, kept live. */
let current: PhoneSettings | null = null
const subscribers = new Set<(value: PhoneSettings) => void>()
let started = false

/**
 * The draft when there is one (drafts perspective), so a phone text added in
 * Site Settings shows up in the dropdowns before Site Settings is published.
 */
const QUERY =
  '*[_id == "siteSettings"][0]{phone, "main": footerPhoneText, "texts": coalesce(phoneTexts[]{_key, name, text}, [])}'

function watch(client: ReturnType<typeof useClient>) {
  if (started) return
  started = true
  const drafts = client.withConfig({perspective: 'drafts'})
  const load = (): Promise<void> =>
    drafts
      .fetch<PhoneSettings | null>(QUERY)
      .then((value) => {
        current = value ?? {texts: []}
        subscribers.forEach((notify) => notify(current!))
      })
      // A failed read (offline, a 5xx) is retried rather than leaving every
      // phone input disabled until the Studio is reloaded.
      .catch(() => {
        setTimeout(load, 5000)
      })
  load()
  // Either document changing: the published Site Settings or its draft.
  client
    .listen('*[_id in ["siteSettings", "drafts.siteSettings"]]', {}, {visibility: 'query', events: ['mutation', 'reconnect']})
    .subscribe({next: () => void load(), error: () => undefined})
}

/** Site Settings' phone, live; null until the first read arrives. */
export function usePhoneSettings(): PhoneSettings | null {
  const client = useClient({apiVersion: '2025-01-01'})
  const [value, setValue] = useState(current)
  useEffect(() => {
    watch(client)
    subscribers.add(setValue)
    // A read that finished between this render and now wasn't delivered.
    if (current) setValue(current)
    return () => {
      subscribers.delete(setValue)
    }
  }, [client])
  return value
}
