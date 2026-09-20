import {useCallback} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Text, Stack, Flex} from '@sanity/ui'
import {ColorInput} from './BorderStyleInput'

export function BackgroundInput(props: ObjectInputProps) {
  const {renderDefault, onChange, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const handleColorChange = useCallback(
    (newValue: string) => {
      onChange(newValue === '' ? unset(['color']) : set(newValue, ['color']))
    },
    [onChange],
  )

  const hasValues = !!vals.color

  const handleClear = useCallback(() => {
    onChange([unset(['color'])])
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
            Background
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
          <Text size={0} muted style={{flexShrink: 0, fontSize: 11, width: 40}}>
            Color
          </Text>
          <ColorInput
            value={vals.color as string | undefined}
            placeholder="#f5f5f5"
            onChange={handleColorChange}
          />
        </Flex>

        {/* Image + conditional fields use default Sanity rendering */}
        {renderDefault({
          ...props,
          members: props.members.filter((m) => !('field' in m && m.field.id === 'color')),
        })}
      </Stack>
    </Card>
  )
}
