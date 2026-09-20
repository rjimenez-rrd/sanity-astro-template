import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack, Box} from '@sanity/ui'

const TYPE_CONFIG: Record<string, {emoji: string; bg: string; border: string; fg: string}> = {
  info: {emoji: 'ℹ️', bg: '#eff6ff', border: '#bfdbfe', fg: '#1e40af'},
  success: {emoji: '✅', bg: '#f0fdf4', border: '#bbf7d0', fg: '#166534'},
  warning: {emoji: '⚠️', bg: '#fffbeb', border: '#fde68a', fg: '#92400e'},
  error: {emoji: '❌', bg: '#fef2f2', border: '#fecaca', fg: '#991b1b'},
  tip: {emoji: '💡', bg: '#faf5ff', border: '#e9d5ff', fg: '#6b21a8'},
}

export function AlertNoticePreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const alertType = (typeof vals.type === 'string' ? vals.type : 'info') as string
  const config = TYPE_CONFIG[alertType] ?? TYPE_CONFIG.info

  const titleText = typeof vals.title === 'string' ? vals.title : ''
  const message = typeof vals.message === 'string' ? vals.message : ''

  const hasContent = titleText || message

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
              <Text size={0} muted>
                {alertType}
              </Text>
            </Flex>
            <Box
              style={{
                padding: '12px 16px',
                backgroundColor: config.bg,
                borderLeft: `4px solid ${config.border}`,
                borderRadius: 4,
              }}
            >
              <Flex gap={3} align="flex-start">
                <Text style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>
                  {config.emoji}
                </Text>
                <Stack space={1}>
                  {titleText && (
                    <Text weight="bold" size={1} style={{color: config.fg}}>
                      {titleText}
                    </Text>
                  )}
                  {message && (
                    <Text size={1} style={{color: config.fg, opacity: 0.85, lineHeight: 1.4}}>
                      {message.length > 100 ? `${message.slice(0, 100)}...` : message}
                    </Text>
                  )}
                </Stack>
              </Flex>
            </Box>
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
