import {useCallback} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, Stack} from '@sanity/ui'
import {ColorInput} from '../controls/ColorInput'
import {CompactSelect} from '../controls/CompactSelect'

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
