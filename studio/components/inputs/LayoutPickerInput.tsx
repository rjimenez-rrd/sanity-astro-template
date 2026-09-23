import {useCallback, useState} from 'react'
import {set, unset, useFormValue} from 'sanity'
import type {StringInputProps} from 'sanity'
import {Box, Button, Card, Dialog, Flex, Grid, Stack, Text} from '@sanity/ui'

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

/** A share of twelve, as the percentage a flex column stores. */
const share = (of12: number) => Math.round((of12 / 12) * 10000) / 100

type Column = {_key?: string; label?: string; content?: unknown[]}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

export function LayoutPickerInput(props: StringInputProps) {
  const {onChange, value, path} = props

  /**
   * Nothing is written until the editor has agreed to what the preset costs.
   * Applying it lives in ColumnsInput, which owns the columns array — but the
   * question has to be asked here, because this field is what triggers it, and
   * writing the preset first would mean undoing a save to back out.
   */
  const columns = (useFormValue([...path.slice(0, -1), 'columns']) as Column[] | undefined) ?? []
  const [pending, setPending] = useState<{
    preset: string
    slots: number
    doomed: Array<{key: string; label: string; blocks: number}>
  } | null>(null)

  const choose = useCallback(
    (preset: string, slots: number) => {
      if (value === preset) {
        onChange(unset())
        return
      }
      // Only columns with blocks in them are worth a question; empty ones are
      // removed either way.
      const doomed = columns
        .map((column, index) => ({column, index}))
        .slice(slots)
        .flatMap(({column, index}) =>
          column?._key && column.content?.length
            ? [
                {
                  key: column._key,
                  // The label shown in the Items list, so the dialog names the
                  // column the editor would click on.
                  label: column.label?.trim() || `Column ${index + 1}`,
                  blocks: column.content.length,
                },
              ]
            : [],
        )

      if (doomed.length === 0) {
        onChange(set(preset))
        return
      }
      setPending({preset, slots, doomed})
    },
    [columns, onChange, value],
  )

  const applyPending = useCallback(() => {
    if (!pending) return
    onChange(set(pending.preset))
    setPending(null)
  }, [pending, onChange])

  return (
    <>
      {pending && (
        <Dialog
          id="layout-preset-confirm"
          header="Change layout?"
          width={1}
          onClose={() => setPending(null)}
          footer={
            <Flex gap={2} justify="flex-end" padding={3}>
              <Button mode="ghost" text="Cancel" onClick={() => setPending(null)} />
              <Button
                tone="critical"
                text={`Change and delete ${plural(pending.doomed.length, 'column')}`}
                onClick={applyPending}
              />
            </Flex>
          }
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>
                {`This layout has ${pending.slots} columns, so ` +
                  `${plural(pending.doomed.length, 'column')} ` +
                  `${pending.doomed.length === 1 ? 'no longer fits' : 'no longer fit'}:`}
              </Text>

              <Stack space={2}>
                {pending.doomed.map((column) => (
                  <Card key={column.key} padding={3} radius={2} border tone="caution">
                    <Flex align="center" justify="space-between" gap={3}>
                      <Text size={1} weight="medium">
                        {column.label}
                      </Text>
                      <Text size={1} muted>
                        {`${plural(column.blocks, 'block')} — will be deleted`}
                      </Text>
                    </Flex>
                  </Card>
                ))}
              </Stack>

              <Text size={1} muted>
                Cancelling changes nothing at all — the layout stays as it is and no column is
                touched. Move the blocks somewhere else first if you want to keep them.
              </Text>
            </Stack>
          </Box>
        </Dialog>
      )}

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
              onClick={() => choose(layout.value, layout.columns.length)}
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
    </>
  )
}
