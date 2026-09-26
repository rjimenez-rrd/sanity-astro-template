import {useEffect, useState} from 'react'
import {useClient, type PreviewProps} from 'sanity'

type Settings = Record<string, string | undefined>

/** (555) 123-4567 for a 10-digit US number (or +1 and 10); anything else as typed. */
function formatPhone(raw?: string) {
  const digits = raw?.replace(/\D/g, '') ?? ''
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : raw?.trim()
}

/** What each Site Info key shows, as the site renders it (frontend siteInfo.ts). */
function valuesFrom(raw: {phone?: string; footerPhoneText?: string} | null): Settings {
  const number = formatPhone(raw?.phone)
  return {phone: raw?.footerPhoneText?.trim() || number, phoneNumber: number}
}

/** One Site Settings read shared by every chip in the Studio, kept live. */
let settings: Settings | null = null
const subscribers = new Set<(value: Settings) => void>()
let started = false

function watchSettings(client: ReturnType<typeof useClient>) {
  if (started) return
  started = true
  const query = '*[_id == "siteSettings"][0]{phone, footerPhoneText}'
  const load = () =>
    client.fetch<{phone?: string; footerPhoneText?: string} | null>(query).then((value) => {
      settings = valuesFrom(value)
      subscribers.forEach((notify) => notify(settings!))
    })
  load()
  client.listen(query, {}, {visibility: 'query'}).subscribe(() => load())
}

/**
 * Shows a Site Info chip in rich text as the value it stands for, e.g.
 * "(833) SANDERS" rather than "phone", so editors read the sentence as the
 * site will. The key arrives as the preview title (see site-info.ts).
 */
export function SiteInfoPreview(props: PreviewProps) {
  const client = useClient({apiVersion: '2025-01-01'})
  const [values, setValues] = useState(settings)
  const key = typeof props.title === 'string' ? props.title : undefined

  useEffect(() => {
    watchSettings(client)
    subscribers.add(setValues)
    return () => {
      subscribers.delete(setValues)
    }
  }, [client])

  const value = key ? values?.[key] : undefined
  return props.renderDefault({
    ...props,
    title: value || (values ? 'No phone in Site Settings' : '…'),
  })
}
