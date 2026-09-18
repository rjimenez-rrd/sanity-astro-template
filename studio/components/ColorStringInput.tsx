import {useCallback} from 'react'
import {type StringInputProps, set, unset} from 'sanity'
import {ColorInput} from './BorderStyleInput'

export function ColorStringInput(props: StringInputProps) {
  const {value, onChange, schemaType} = props

  // The field's own `initialValue` doubles as the swatch shown while empty.
  // Only a literal string can be used — initialValue may also be a resolver fn.
  const {initialValue} = schemaType
  const fallback = typeof initialValue === 'string' ? initialValue : undefined

  const handleChange = useCallback(
    (v: string) => {
      onChange(v === '' ? unset() : set(v))
    },
    [onChange],
  )

  return (
    <ColorInput
      value={value}
      fallback={fallback}
      placeholder={schemaType.placeholder || fallback || '#000000'}
      onChange={handleChange}
    />
  )
}
