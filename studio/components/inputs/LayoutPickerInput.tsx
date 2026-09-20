import {set, unset} from 'sanity'
import type {StringInputProps} from 'sanity'
import {Card, Flex, Grid, Text, Box} from '@sanity/ui'

const LAYOUTS = [
  {value: 'full', label: 'Full Width', columns: [12]},
  {value: '50-50', label: '50 / 50', columns: [6, 6]},
  {value: '33-66', label: '33 / 66', columns: [4, 8]},
  {value: '66-33', label: '66 / 33', columns: [8, 4]},
  {value: '25-75', label: '25 / 75', columns: [3, 9]},
  {value: '75-25', label: '75 / 25', columns: [9, 3]},
  {value: '33-33-33', label: '33 / 33 / 33', columns: [4, 4, 4]},
  {value: '25-50-25', label: '25 / 50 / 25', columns: [3, 6, 3]},
  {value: '25-25-25-25', label: '25 / 25 / 25 / 25', columns: [3, 3, 3, 3]},
] as const

export function LayoutPickerInput(props: StringInputProps) {
  const {onChange, value} = props

  return (
    <Grid columns={3} gap={3} padding={1}>
      {LAYOUTS.map((layout) => {
        const isSelected = value === layout.value
        return (
          <Card
            key={layout.value}
            padding={3}
            radius={2}
            shadow={isSelected ? 2 : 1}
            tone={isSelected ? 'primary' : 'default'}
            style={{cursor: 'pointer', transition: 'all 0.15s ease'}}
            onClick={() => onChange(value === layout.value ? unset() : set(layout.value))}
          >
            <Flex direction="column" gap={2} align="center">
              <Flex gap={1} style={{width: '100%', height: 28}}>
                {layout.columns.map((col, i) => (
                  <Box
                    key={i}
                    style={{
                      flex: col,
                      height: '100%',
                      backgroundColor: isSelected
                        ? 'var(--card-badge-primary-bg-color)'
                        : 'var(--card-border-color)',
                      borderRadius: 3,
                      transition: 'background-color 0.15s ease',
                    }}
                  />
                ))}
              </Flex>
              <Text size={0} muted={!isSelected} style={{whiteSpace: 'nowrap'}}>
                {layout.label}
              </Text>
            </Flex>
          </Card>
        )
      })}
    </Grid>
  )
}
