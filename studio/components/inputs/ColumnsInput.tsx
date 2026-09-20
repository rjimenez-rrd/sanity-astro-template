import {useCallback} from 'react'
import {
  type ArrayOfObjectsInputProps,
  useFormValue,
  insert,
  setIfMissing,
} from 'sanity'
import {randomKey} from '@sanity/util/content'
import {Button, Card, Flex, Text, Stack, Box} from '@sanity/ui'
import {AddIcon, WarningOutlineIcon} from '@sanity/icons'

const LAYOUT_COLUMN_COUNT: Record<string, number> = {
  'full': 1,
  '50-50': 2,
  '33-66': 2,
  '66-33': 2,
  '25-75': 2,
  '75-25': 2,
  '33-33-33': 3,
  '25-50-25': 3,
  '25-25-25-25': 4,
}

const LAYOUT_WIDTHS: Record<string, number[]> = {
  'full': [12],
  '50-50': [6, 6],
  '33-66': [4, 8],
  '66-33': [8, 4],
  '25-75': [3, 9],
  '75-25': [9, 3],
  '33-33-33': [4, 4, 4],
  '25-50-25': [3, 6, 3],
  '25-25-25-25': [3, 3, 3, 3],
}

const POSITION_LABELS: Record<number, string[]> = {
  1: ['Content'],
  2: ['Left', 'Right'],
  3: ['Left', 'Center', 'Right'],
  4: ['1st', '2nd', '3rd', '4th'],
}

const WIDTH_LABELS: Record<number, string> = {
  3: '25%',
  4: '33%',
  6: '50%',
  8: '66%',
  9: '75%',
  12: '100%',
}

// Built by hand here, so the schema's initialValue doesn't apply; mirror it.
function createEmptyColumn(span?: number) {
  const container: Record<string, unknown> = {
    layoutType: 'flex',
    direction: {desktop: 'column'},
  }
  // A flex column carries its own width; a grid column is sized by its track,
  // so only the flex path seeds one from the preset.
  if (span) {
    container.width = {desktop: {size: Math.round((span / 12) * 10000) / 100, unit: '%'}}
  }
  return {
    _type: 'gridColumn',
    _key: randomKey(12),
    container,
  }
}

export function ColumnsInput(props: ArrayOfObjectsInputProps) {
  const {onChange, value, renderDefault} = props

  const parentPath = props.path.slice(0, -1)
  const container = useFormValue([...parentPath, 'container']) as {layoutType?: string} | undefined
  const gridLayout = useFormValue([...parentPath, 'layout']) as string | undefined

  // Grid presets fix the column count; a flex container takes any number of
  // items, so it only offers a two-column start when empty.
  const isFlex = Boolean(container) && container?.layoutType !== 'grid'
  // The preset drives flex containers too. It only becomes grid tracks in Grid
  // mode; in flex it just says how many columns to add and how wide each starts.
  const layout = gridLayout

  const currentCount = value?.length ?? 0
  const presetCount = (layout ? LAYOUT_COLUMN_COUNT[layout] : 0) || 2
  // Flex takes any number of items, so the preset only offers the columns it is
  // missing, and never flags extras as too many.
  const expectedCount = isFlex
    ? currentCount < presetCount
      ? presetCount
      : 0
    : layout
      ? LAYOUT_COLUMN_COUNT[layout] ?? 0
      : 0
  const widths = layout ? LAYOUT_WIDTHS[layout] ?? [] : []
  const positions = POSITION_LABELS[expectedCount] ?? []
  const needsColumns = expectedCount > 0 && currentCount < expectedCount
  const tooManyColumns = expectedCount > 0 && currentCount > expectedCount
  const columnsToAdd = expectedCount - currentCount

  const handleAddColumns = useCallback(() => {
    if (columnsToAdd <= 0) return

    const items = Array.from({length: columnsToAdd}, (_, i) =>
      createEmptyColumn(isFlex ? widths[currentCount + i] : undefined),
    )

    onChange([setIfMissing([]), insert(items, 'after', [-1])])
  }, [columnsToAdd, currentCount, isFlex, widths, onChange])

  const showDiagram = layout && currentCount > 0 && widths.length > 0

  return (
    <Stack space={3}>
      {showDiagram && (
        <Flex gap={2}>
          {widths.map((width, i) => {
            const hasColumn = i < currentCount
            const position = positions[i] ?? `Col ${i + 1}`
            const widthLabel = WIDTH_LABELS[width] ?? `${width}/12`
            const contentCount = hasColumn
              ? ((value?.[i] as {content?: unknown[]})?.content?.length ?? 0)
              : 0

            return (
              <Card
                key={i}
                padding={3}
                radius={2}
                border
                tone={hasColumn ? 'primary' : 'default'}
                style={{
                  flex: width,
                  opacity: hasColumn ? 1 : 0.4,
                }}
              >
                <Stack space={2}>
                  <Flex align="center" justify="space-between">
                    <Text size={1} weight="bold">
                      {position}
                    </Text>
                    <Text size={0} muted>
                      {widthLabel}
                    </Text>
                  </Flex>
                  <Box>
                    <Text size={0} muted>
                      {hasColumn
                        ? contentCount > 0
                          ? `${contentCount} block${contentCount !== 1 ? 's' : ''}`
                          : 'Empty'
                        : 'Missing'}
                    </Text>
                  </Box>
                </Stack>
              </Card>
            )
          })}
        </Flex>
      )}

      {needsColumns && (
        <Card padding={3} radius={2} tone="primary" border>
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1}>
              {currentCount === 0
                ? `Add ${expectedCount} column${expectedCount !== 1 ? 's' : ''} to get started.`
                : `This layout needs ${expectedCount} columns. You have ${currentCount}.`}
            </Text>
            <Button
              icon={AddIcon}
              text={
                currentCount === 0
                  ? `Add ${expectedCount} column${expectedCount !== 1 ? 's' : ''}`
                  : `Add ${columnsToAdd} more`
              }
              tone="primary"
              onClick={handleAddColumns}
            />
          </Flex>
        </Card>
      )}

      {tooManyColumns && (
        <Card padding={3} radius={2} tone="transparent" border>
          <Flex align="center" gap={2}>
            <Text size={1}>
              Extra columns will wrap to a new row.
            </Text>
          </Flex>
        </Card>
      )}

      {renderDefault(props)}
    </Stack>
  )
}
