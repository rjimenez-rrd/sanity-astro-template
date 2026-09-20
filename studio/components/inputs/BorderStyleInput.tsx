import {ColorPicker} from './color/ColorPicker'
import {useCallback} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, Stack} from '@sanity/ui'


function CompactSelect({
  value,
  options,
  onChange,
  placeholder,
  width,
}: {
  value?: string
  options: {title: string; value: string}[]
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: width ? undefined : 1,
        width: width ?? undefined,
        padding: '6px 8px',
        fontSize: 12,
        fontFamily: 'inherit',
        border: '1px solid var(--card-border-color)',
        borderRadius: 4,
        backgroundColor: 'var(--card-bg-color)',
        color: value ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
        cursor: 'pointer',
      }}
    >
      <option value="">{placeholder ?? '—'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.title}
        </option>
      ))}
    </select>
  )
}

/**
 * The Studio's shared color control: swatch + inline text, with the
 * Elementor-style picker (saturation, hue, alpha, HEXA/RGBA/HSLA) on click.
 */
function ColorInput({
  value,
  onChange,
  placeholder,
  fallback,
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  /** Swatch shown while the field is empty. Display only — never written to the document. */
  fallback?: string
}) {
  return (
    <ColorPicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      fallback={fallback}
      showInput
    />
  )
}

export function BorderStyleInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const vals = (value ?? {}) as Record<string, string | undefined>

  const handleChange = useCallback(
    (field: string, newValue: string) => {
      onChange(newValue === '' ? unset([field]) : set(newValue, [field]))
    },
    [onChange],
  )

  const hasValues = !!(vals.width || vals.style || vals.color)

  const handleClear = useCallback(() => {
    onChange([unset(['width']), unset(['style']), unset(['color'])])
  }, [onChange])

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text
            size={0}
            weight="bold"
            muted
            style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}
          >
            Border
          </Text>
          {hasValues && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--card-muted-fg-color)',
                fontSize: 10,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Clear
            </button>
          )}
        </Flex>
        <Flex gap={2} align="center">
          <CompactSelect
            value={vals.width}
            placeholder="Width"
            width={72}
            options={[
              {title: '0', value: '0'},
              {title: '1px', value: '1px'},
              {title: '2px', value: '2px'},
              {title: '3px', value: '3px'},
              {title: '4px', value: '4px'},
            ]}
            onChange={(v) => handleChange('width', v)}
          />
          <CompactSelect
            value={vals.style}
            placeholder="Style"
            width={80}
            options={[
              {title: 'Solid', value: 'solid'},
              {title: 'Dashed', value: 'dashed'},
              {title: 'Dotted', value: 'dotted'},
            ]}
            onChange={(v) => handleChange('style', v)}
          />
          <ColorInput
            value={vals.color}
            placeholder="#e5e7eb"
            onChange={(v) => handleChange('color', v)}
          />
        </Flex>
      </Stack>
    </Card>
  )
}

export {ColorInput, CompactSelect}
