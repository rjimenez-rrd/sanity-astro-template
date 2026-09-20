import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack, Box} from '@sanity/ui'

export function CodeBlockPreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const vals = (value ?? {}) as Record<string, unknown>

  const code = typeof vals.code === 'string' ? vals.code : ''
  const language = typeof vals.language === 'string' ? vals.language : 'code'
  const filename = typeof vals.filename === 'string' ? vals.filename : ''
  const showLineNumbers = vals.showLineNumbers !== false

  const lines = code ? code.split('\n').slice(0, 10) : []
  const hasContent = code.length > 0

  return (
    <Stack space={3}>
      {hasContent && (
        <Card padding={0} radius={2} border tone="transparent" style={{overflow: 'hidden'}}>
          {/* Tab bar */}
          <Flex
            align="center"
            justify="space-between"
            style={{
              padding: '6px 12px',
              backgroundColor: '#1e1e2e',
              borderBottom: '1px solid #313244',
            }}
          >
            <Flex gap={2} align="center">
              {/* Fake traffic lights */}
              <Flex gap={1}>
                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f38ba8'}} />
                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f9e2af'}} />
                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: '#a6e3a1'}} />
              </Flex>
              {filename && (
                <Text size={0} style={{color: '#cdd6f4', fontSize: 11, marginLeft: 8}}>
                  {filename}
                </Text>
              )}
            </Flex>
            <Text size={0} style={{color: '#6c7086', fontSize: 10, textTransform: 'uppercase'}}>
              {language}
            </Text>
          </Flex>

          {/* Code area */}
          <Box
            style={{
              padding: '10px 12px',
              backgroundColor: '#1e1e2e',
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
              fontSize: 11,
              lineHeight: 1.6,
              overflowX: 'auto',
            }}
          >
            {lines.map((line, i) => (
              <Flex key={i} gap={3}>
                {showLineNumbers && (
                  <Text
                    size={0}
                    style={{
                      color: '#585b70',
                      fontSize: 11,
                      fontFamily: 'inherit',
                      minWidth: 20,
                      textAlign: 'right',
                      userSelect: 'none',
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
                <Text
                  size={0}
                  style={{
                    color: '#cdd6f4',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    whiteSpace: 'pre',
                  }}
                >
                  {line || ' '}
                </Text>
              </Flex>
            ))}
            {code.split('\n').length > 10 && (
              <Text size={0} style={{color: '#585b70', fontSize: 11, fontFamily: 'inherit', marginTop: 4}}>
                ... {code.split('\n').length - 10} more lines
              </Text>
            )}
          </Box>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
