import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack, Box} from '@sanity/ui'

function getStringValue(field: unknown): string {
  return typeof field === 'string' ? field : ''
}

export function PricingCardPreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const badge = getStringValue(vals.badge)
  const title = getStringValue(vals.title)
  const price = getStringValue(vals.price)
  const priceSubtext = getStringValue(vals.priceSubtext)
  const isHighlighted = vals.isHighlighted === true
  const features = Array.isArray(vals.features) ? (vals.features as Array<Record<string, unknown>>) : []

  const hasContent = title || price

  return (
    <Stack space={3}>
      {hasContent && (
        <Card padding={2} radius={2} border tone="transparent">
          <Stack space={2}>
            <Flex align="center" justify="space-between" paddingX={1}>
              <Text
                size={0}
                weight="bold"
                muted
                style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}
              >
                Preview
              </Text>
              {isHighlighted && (
                <Text size={0} style={{color: 'var(--card-badge-primary-fg-color)'}}>
                  ★ Highlighted
                </Text>
              )}
            </Flex>
            <Box
              style={{
                padding: 16,
                borderRadius: 8,
                border: isHighlighted
                  ? '2px solid var(--card-badge-primary-bg-color)'
                  : '1px solid var(--card-border-color)',
                backgroundColor: 'var(--card-bg-color)',
                textAlign: 'center',
              }}
            >
              <Stack space={3}>
                {badge && (
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        backgroundColor: 'var(--card-badge-primary-bg-color)',
                        color: 'var(--card-badge-primary-fg-color)',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {badge}
                    </span>
                  </div>
                )}

                {title && (
                  <Text size={1} weight="bold">
                    {title}
                  </Text>
                )}

                {price && (
                  <Stack space={1}>
                    <Text
                      weight="bold"
                      style={{fontSize: 28, lineHeight: 1.1, color: 'var(--card-fg-color)'}}
                    >
                      {price}
                    </Text>
                    {priceSubtext && (
                      <Text size={0} muted>
                        {priceSubtext}
                      </Text>
                    )}
                  </Stack>
                )}

                {features.length > 0 && (
                  <Stack space={1} style={{textAlign: 'left', paddingTop: 4}}>
                    {features.slice(0, 4).map((f, i) => {
                      const text = getStringValue(f.text)
                      const included = f.included !== false
                      return (
                        <Flex key={i} gap={2} align="center">
                          <Text size={0} style={{color: included ? '#16a34a' : '#dc2626', flexShrink: 0}}>
                            {included ? '✓' : '✗'}
                          </Text>
                          <Text
                            size={0}
                            muted={!included}
                            style={{
                              textDecoration: included ? 'none' : 'line-through',
                              opacity: included ? 1 : 0.5,
                            }}
                          >
                            {text || 'Feature'}
                          </Text>
                        </Flex>
                      )
                    })}
                    {features.length > 4 && (
                      <Text size={0} muted>
                        +{features.length - 4} more...
                      </Text>
                    )}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
