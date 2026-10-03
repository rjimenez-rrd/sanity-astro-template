import {useEffect, useState} from 'react'
import {Select} from '@sanity/ui'
import {set, unset, useClient, type StringInputProps} from 'sanity'

type Office = {_key: string; name?: string; address?: string}

/**
 * The draft when there is one (drafts perspective), so an office added in
 * Site Settings shows up here before Site Settings is published.
 */
const QUERY = '*[_id == "siteSettings"][0].footerOffices[]{_key, name, address}'

/**
 * Picks one of the offices listed in Site Settings → Footer → Offices. Saved by
 * its _key, so renaming the office or changing its address keeps every page
 * that shows it. The list is read live, so a new office shows up right away.
 */
export function OfficeInput(props: StringInputProps) {
  const {value, onChange, readOnly} = props
  const client = useClient({apiVersion: '2025-03-20'})
  const [offices, setOffices] = useState<Office[] | null>(null)

  useEffect(() => {
    const drafts = client.withConfig({perspective: 'drafts'})
    const load = () =>
      drafts
        .fetch<Office[] | null>(QUERY)
        .then((list) => setOffices(list ?? []))
        .catch(() => setOffices((current) => current ?? []))
    load()
    const subscription = client
      .listen('*[_id in ["siteSettings", "drafts.siteSettings"]]', {}, {visibility: 'query', events: ['mutation', 'reconnect']})
      .subscribe({next: () => void load(), error: () => undefined})
    return () => subscription.unsubscribe()
  }, [client])

  const missing = Boolean(value && offices && !offices.some((o) => o._key === value))

  return (
    <Select
      value={value ?? ''}
      disabled={readOnly || !offices}
      onChange={(event) => {
        const next = event.currentTarget.value
        onChange(next ? set(next) : unset())
      }}
    >
      <option value="">None</option>
      {offices?.map((office) => (
        <option key={office._key} value={office._key}>
          {office.name || 'Untitled office'}
          {office.address ? ` — ${office.address.replace(/\s*\n\s*/g, ', ')}` : ''}
        </option>
      ))}
      {missing && <option value={value}>Deleted office (nothing is shown)</option>}
    </Select>
  )
}
