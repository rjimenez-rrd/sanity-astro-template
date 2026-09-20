import {useCallback} from 'react'
import {type StringInputProps, set, unset, useColorSchemeValue} from 'sanity'
import {Card, Stack, Text} from '@sanity/ui'
import CodeMirror from '@uiw/react-codemirror'
import {css as cssLanguage} from '@codemirror/lang-css'

/**
 * CodeMirror with the real CSS language, so properties and values autocomplete.
 *
 * @sanity/code-input would have been less code, but it drives CSS through a
 * legacy stream mode — highlighting only, no completion source. The value stays
 * a plain string either way, so the frontend's scopeCustomCss needs no change.
 */
export function CustomCssInput(props: StringInputProps) {
  const {onChange, value, elementProps} = props
  const scheme = useColorSchemeValue()

  const handleChange = useCallback(
    (next: string) => {
      onChange(next.trim() ? set(next) : unset())
    },
    [onChange],
  )

  return (
    <Stack space={2}>
      <Card border radius={2} overflow="hidden" tone="transparent">
        <CodeMirror
          id={elementProps?.id}
          value={value ?? ''}
          height="200px"
          theme={scheme === 'dark' ? 'dark' : 'light'}
          extensions={[cssLanguage()]}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            autocompletion: true,
            highlightActiveLine: false,
            // The value is scoped before it renders, so a stray brace is a
            // typo to fix rather than something to flag mid-keystroke.
            lintKeymap: false,
          }}
        />
      </Card>
      <Text size={0} muted>
        Ctrl+Space for suggestions. Scoped to this element — bare declarations apply to it,
        and <code>&amp;</code> stands for it in a nested rule.
      </Text>
    </Stack>
  )
}
