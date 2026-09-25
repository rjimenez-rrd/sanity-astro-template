import {Card, Text, Stack} from '@sanity/ui'
import type {StringInputProps} from 'sanity'

const format = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {dateStyle: 'long', timeStyle: 'short'}).format(new Date(iso))

/**
 * A date the Publish action stamps (publishedAt, updatedAt), shown as plain
 * text rather than a date picker: nobody sets these by hand.
 */
export function PublishStampInput(props: StringInputProps) {
  return (
  <Stack gap={4}>
    <Text size={1} weight="semibold">
      {props.id === 'publishedAt' ? 'Published' : 'Last Updated'}
    </Text>
    <Card padding={3} radius={2} border tone="transparent">
      <Text size={1} muted={!props.value}>
        {props.value ? format(props.value) : 'Set when published'}
      </Text>
    </Card>
  </Stack>
  )
}
