import {useEffect, useState} from 'react'
import {useClient, type PreviewProps} from 'sanity'

type Settings = Record<string, string | undefined>

/** One Site Settings read shared by every chip in the Studio, kept live. */
let settings: Settings | null = null
const subscribers = new Set<(value: Settings) => void>()
let started = false

function watchSettings(client: ReturnType<typeof useClient>) {
  if (started) return
  started = true
  const query = '*[_id == "siteSettings"][0]{phone}'
  const load = () =>
    client.fetch<Settings | null>(query).then((value) => {
      settings = value ?? {}
      subscribers.forEach((notify) => notify(settings!))
    })
  load()
  client.listen(query, {}, {visibility: 'query'}).subscribe(() => load())
}

/**
 * Shows a Site Info chip in rich text as the value it stands for, e.g.
 * "(555) 123-4567" rather than "phone", so editors read the sentence as the
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
    title: value || (values ? `No ${key ?? 'value'} in Site Settings` : '…'),
  })
}
