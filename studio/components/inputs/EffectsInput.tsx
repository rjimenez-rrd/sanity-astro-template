import {useCallback} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, Stack} from '@sanity/ui'
import {CompactSelect} from './BorderStyleInput'

export function EffectsInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const handleChange = useCallback(
    (field: string, newValue: string) => {
      onChange(newValue === '' ? unset([field]) : set(newValue, [field]))
    },
    [onChange],
  )

  const handleNumberChange = useCallback(
    (field: string, newValue: string) => {
      if (newValue === '') {
        onChange(unset([field]))
      } else {
        const num = parseInt(newValue, 10)
        if (!isNaN(num) && num >= 0 && num <= 100) {
          onChange(set(num, [field]))
        }
      }
    },
    [onChange],
  )

  const hasValues = !!(vals.shadow || vals.opacity !== undefined || vals.overflow)

  const handleClear = useCallback(() => {
    onChange([unset(['shadow']), unset(['opacity']), unset(['overflow'])])
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
            Effects
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
            value={vals.shadow as string | undefined}
            placeholder="Shadow"
            options={[
              {title: 'None', value: 'none'},
              {title: 'Small', value: 'sm'},
              {title: 'Medium', value: 'md'},
              {title: 'Large', value: 'lg'},
              {title: 'XL', value: 'xl'},
            ]}
            onChange={(v) => handleChange('shadow', v)}
          />

          <Flex align="center" gap={1} style={{flex: 1}}>
            <Text size={0} muted style={{flexShrink: 0, fontSize: 11}}>
              Opacity
            </Text>
            <input
              type="number"
              min={0}
              max={100}
              value={typeof vals.opacity === 'number' ? vals.opacity : ''}
              placeholder="100"
              onChange={(e) => handleNumberChange('opacity', e.target.value)}
              style={{
                width: 56,
                padding: '6px 8px',
                fontSize: 12,
                fontFamily: 'inherit',
                border: '1px solid var(--card-border-color)',
                borderRadius: 4,
                backgroundColor: 'var(--card-bg-color)',
                color: 'var(--card-fg-color)',
                textAlign: 'center',
              }}
            />
            <Text size={0} muted>
              %
            </Text>
          </Flex>

          <CompactSelect
            value={vals.overflow as string | undefined}
            placeholder="Overflow"
            width={90}
            options={[
              {title: 'Visible', value: 'visible'},
              {title: 'Hidden', value: 'hidden'},
            ]}
            onChange={(v) => handleChange('overflow', v)}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
