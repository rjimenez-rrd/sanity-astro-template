import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack, Box} from '@sanity/ui'

export function TestimonialPreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const quote = typeof vals.quote === 'string' ? vals.quote : ''
  const name = typeof vals.name === 'string' ? vals.name : ''
  const title = typeof vals.title === 'string' ? vals.title : ''
  const rating = typeof vals.rating === 'number' ? (vals.rating as number) : 0

  const hasContent = quote || name

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
            <Box style={{padding: '8px 0'}}>
              <Stack space={3}>
                {/* Big opening quote mark */}
                <Text
                  style={{
                    fontSize: 48,
                    lineHeight: '0.8',
                    color: 'var(--card-badge-primary-bg-color)',
                    fontFamily: 'Georgia, serif',
                    opacity: 0.6,
                  }}
                >
                  &ldquo;
                </Text>

                {quote && (
                  <Text
                    size={2}
                    style={{
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      color: 'var(--card-fg-color)',
                    }}
                  >
                    {quote.length > 120 ? `${quote.slice(0, 120)}...` : quote}
                  </Text>
                )}

                {rating > 0 && (
                  <Text size={1} style={{letterSpacing: '0.1em'}}>
                    {Array.from({length: 5}, (_, i) => (i < rating ? '★' : '☆')).join('')}
                  </Text>
                )}

                <Flex gap={2} align="center">
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--card-badge-primary-bg-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      opacity: 0.3,
                    }}
                  >
                    <Text size={0} style={{color: '#fff', fontWeight: 700}}>
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </div>
                  <Stack space={1}>
                    {name && (
                      <Text size={1} weight="bold">
                        {name}
                      </Text>
                    )}
                    {title && (
                      <Text size={0} muted>
                        {title}
                      </Text>
                    )}
                  </Stack>
                </Flex>
              </Stack>
            </Box>
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
