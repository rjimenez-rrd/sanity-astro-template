import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack} from '@sanity/ui'

export function StatMetricPreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const prefix = typeof vals.prefix === 'string' ? vals.prefix : ''
  const statValue = typeof vals.value === 'string' ? vals.value : ''
  const suffix = typeof vals.suffix === 'string' ? vals.suffix : ''
  const label = typeof vals.label === 'string' ? vals.label : ''
  const size = (typeof vals.size === 'string' ? vals.size : 'medium') as string

  const fontSize = {small: 28, medium: 40, large: 56}[size] ?? 40
  const hasContent = statValue || label

  return (
    <Stack space={3}>
      {hasContent && (
        <Card padding={4} radius={2} border tone="transparent">
          <Stack space={2}>
            <Text
              size={0}
              weight="bold"
              muted
              style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}
            >
              Preview
            </Text>
            <Flex direction="column" align="center" justify="center" style={{minHeight: 80}}>
              <Text
                weight="bold"
                style={{
                  fontSize,
                  lineHeight: 1.1,
                  color: 'var(--card-fg-color)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {prefix}
                {statValue || '0'}
                {suffix}
              </Text>
              {label && (
                <Text
                  size={1}
                  muted
                  style={{marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11}}
                >
                  {label}
                </Text>
              )}
            </Flex>
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
