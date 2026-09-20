import {useCallback} from 'react'
import {type StringInputProps, set, unset} from 'sanity'
import {Card, Flex, Stack, Text} from '@sanity/ui'

const ALIGNMENTS = [
  {
    value: 'left',
    label: 'Left',
    description: 'Icon left, text right',
    render: () => (
      <Flex gap={2} align="center" style={{width: '100%'}}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: 'var(--card-badge-primary-bg-color)',
            flexShrink: 0,
          }}
        />
        <Stack space={1} style={{flex: 1}}>
          <div
            style={{
              height: 4,
              width: '70%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              height: 3,
              width: '100%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.2,
            }}
          />
          <div
            style={{
              height: 3,
              width: '85%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.2,
            }}
          />
        </Stack>
      </Flex>
    ),
  },
  {
    value: 'center',
    label: 'Center',
    description: 'Icon above, text below',
    render: () => (
      <Flex direction="column" align="center" gap={2} style={{width: '100%'}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            backgroundColor: 'var(--card-badge-primary-bg-color)',
          }}
        />
        <Stack space={1} style={{width: '100%', alignItems: 'center', display: 'flex', flexDirection: 'column'}}>
          <div
            style={{
              height: 4,
              width: '60%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              height: 3,
              width: '80%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.2,
            }}
          />
        </Stack>
      </Flex>
    ),
  },
  {
    value: 'right',
    label: 'Right',
    description: 'Text left, icon right',
    render: () => (
      <Flex gap={2} align="center" style={{width: '100%'}}>
        <Stack space={1} style={{flex: 1}}>
          <div
            style={{
              height: 4,
              width: '70%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.6,
              marginLeft: 'auto',
            }}
          />
          <div
            style={{
              height: 3,
              width: '100%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.2,
            }}
          />
          <div
            style={{
              height: 3,
              width: '85%',
              borderRadius: 2,
              backgroundColor: 'var(--card-fg-color)',
              opacity: 0.2,
              marginLeft: 'auto',
            }}
          />
        </Stack>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: 'var(--card-badge-primary-bg-color)',
            flexShrink: 0,
          }}
        />
      </Flex>
    ),
  },
] as const

export function IconTextAlignmentInput(props: StringInputProps) {
  const {value, onChange} = props

  const handleSelect = useCallback(
    (newValue: string) => {
      onChange(newValue === value ? unset() : set(newValue))
    },
    [onChange, value],
  )

  return (
    <Stack space={2}>
      <Text size={0} weight="bold" muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}>
        Layout
      </Text>
      <Flex gap={2}>
        {ALIGNMENTS.map((alignment) => {
          const isSelected = value === alignment.value
          return (
            <Card
              key={alignment.value}
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
              onClick={() => handleSelect(alignment.value)}
            >
              <Stack space={2}>
                <div style={{padding: '4px 0', minHeight: 40, display: 'flex', alignItems: 'center'}}>
                  {alignment.render()}
                </div>
                <Text size={0} align="center" muted>
                  {alignment.label}
                </Text>
              </Stack>
            </Card>
          )
        })}
      </Flex>
    </Stack>
  )
}
