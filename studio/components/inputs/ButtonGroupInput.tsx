import {useCallback} from 'react'
import {type StringInputProps, set} from 'sanity'
import {Card, Flex, Stack, Text} from '@sanity/ui'

const DIRECTIONS = [
  {
    value: 'horizontal',
    label: 'Horizontal',
    render: () => (
      <Flex gap={1} align="center" justify="center" style={{minHeight: 32}}>
        <div
          style={{
            width: 36,
            height: 14,
            borderRadius: 3,
            backgroundColor: 'var(--card-badge-primary-bg-color)',
          }}
        />
        <div
          style={{
            width: 36,
            height: 14,
            borderRadius: 3,
            border: '1.5px solid var(--card-badge-primary-bg-color)',
            backgroundColor: 'transparent',
          }}
        />
      </Flex>
    ),
  },
  {
    value: 'vertical',
    label: 'Vertical',
    render: () => (
      <Flex direction="column" gap={1} align="center" justify="center" style={{minHeight: 32}}>
        <div
          style={{
            width: 44,
            height: 12,
            borderRadius: 3,
            backgroundColor: 'var(--card-badge-primary-bg-color)',
          }}
        />
        <div
          style={{
            width: 44,
            height: 12,
            borderRadius: 3,
            border: '1.5px solid var(--card-badge-primary-bg-color)',
            backgroundColor: 'transparent',
          }}
        />
      </Flex>
    ),
  },
] as const

export function ButtonGroupInput(props: StringInputProps) {
  const {value, onChange} = props

  const handleSelect = useCallback(
    (newValue: string) => {
      onChange(set(newValue))
    },
    [onChange],
  )

  return (
    <Stack space={2}>
      <Text size={0} weight="bold" muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}>
        Direction
      </Text>
      <Flex gap={2}>
        {DIRECTIONS.map((dir) => {
          const isSelected = (value ?? 'horizontal') === dir.value
          return (
            <Card
              key={dir.value}
              padding={3}
              radius={2}
              border
              tone={isSelected ? 'primary' : 'default'}
              style={{
                cursor: 'pointer',
                flex: 1,
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 0 2px var(--card-badge-primary-bg-color)' : undefined,
              }}
              onClick={() => handleSelect(dir.value)}
            >
              <Stack space={2}>
                {dir.render()}
                <Text size={0} align="center" muted>
                  {dir.label}
                </Text>
              </Stack>
            </Card>
          )
        })}
      </Flex>
    </Stack>
  )
}
