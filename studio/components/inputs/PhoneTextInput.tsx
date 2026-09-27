import {Select} from '@sanity/ui'
import {set, type StringInputProps} from 'sanity'
import {formatPhone, usePhoneSettings} from '../phoneSettings'

/**
 * Picks which wording of the site's phone to show: the Main Phone Text, one
 * of More Phone Texts, or the number. The choices are read live from Site
 * Settings, so a text added there shows up here right away. A text is saved
 * by its _key, so renaming or rewording it keeps every phone that uses it.
 */
export function PhoneTextInput(props: StringInputProps) {
  const settings = usePhoneSettings()
  const {value, onChange, readOnly} = props
  const number = formatPhone(settings?.phone)
  const main = settings?.main?.trim() || number

  // Older saves say 'phone'/'display' for the Main text and 'phoneNumber'
  // for the number; show them as the same options.
  const selected =
    !value || value === 'phone' || value === 'display' ? 'main' : value === 'phoneNumber' ? 'number' : value
  const missing =
    settings && selected !== 'main' && selected !== 'number' && !settings.texts.some((t) => t._key === selected)

  return (
    <Select
      value={selected}
      disabled={readOnly || !settings}
      onChange={(event) => onChange(set(event.currentTarget.value))}
    >
      <option value="main">Main Phone Text{main ? ` — ${main}` : ''}</option>
      {settings?.texts.map((t) => (
        <option key={t._key} value={t._key}>
          {t.name || 'Untitled'}
          {t.text ? ` — ${t.text}` : ''}
        </option>
      ))}
      <option value="number">The number{number ? ` — ${number}` : ''}</option>
      {missing && <option value={selected}>Deleted text (shows the Main Phone Text)</option>}
    </Select>
  )
}
