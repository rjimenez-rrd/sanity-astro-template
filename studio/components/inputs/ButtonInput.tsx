import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ColorInput} from './BorderStyleInput'

/**
 * The Button block's form, with its four color fields drawn as Elementor-style
 * Normal / Hover tabs instead of four loose fields.
 *
 * The colors stay plain top-level fields on the button — this only changes how
 * they are edited, so buttons saved before the tabs existed keep working.
 * The rest of the form is Sanity's own default, rendered around the tabs.
 */

const COLOR_FIELDS = ['color', 'textColor', 'hoverColor', 'hoverTextColor'] as const

const STATES = [
  {
    key: 'normal',
    label: 'Normal',
    background: 'color',
    text: 'textColor',
  },
  {
    key: 'hover',
    label: 'Hover',
    background: 'hoverColor',
    text: 'hoverTextColor',
  },
] as const

/** Fields that come before the colors; everything else follows them. */
const BEFORE_COLORS = new Set(['label', 'variant'])

export function ButtonInput(props: ObjectInputProps) {
  const {onChange, value, members, renderDefault} = props
  const vals = (value ?? {}) as Record<string, string | undefined>
  const [active, setActive] = useState(0)
  const state = STATES[active]

  const write = useCallback(
    (field: string, next: string) => {
      onChange(next ? set(next, [field]) : unset([field]))
    },
    [onChange],
  )

  const isColor = (m: (typeof members)[number]) =>
    m.kind === 'field' && (COLOR_FIELDS as readonly string[]).includes(m.name)
  const before = members.filter((m) => !isColor(m) && m.kind === 'field' && BEFORE_COLORS.has(m.name))
  const after = members.filter((m) => !isColor(m) && !before.includes(m))

  const hasValuesFor = (s: (typeof STATES)[number]) => Boolean(vals[s.background] || vals[s.text])

  return (
    <Stack space={5}>
      {renderDefault({...props, members: before})}

      <Stack space={3}>
        <Text size={1} weight="medium">
          Colors
        </Text>
        <Card padding={3} radius={2} border tone="transparent">
          <Stack space={4}>
            <Flex gap={0}>
              {STATES.map((item, i) => {
                const isActive = i === active
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActive(i)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      border: '1px solid var(--card-border-color)',
                      borderLeft: i > 0 ? 'none' : undefined,
                      borderRadius: i === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                      backgroundColor: isActive
                        ? 'var(--card-badge-primary-bg-color)'
                        : 'var(--card-bg-color)',
                      color: isActive
                        ? 'var(--card-badge-primary-fg-color)'
                        : 'var(--card-fg-color)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {item.label}
                    {hasValuesFor(item) && !isActive && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          backgroundColor: 'var(--card-badge-primary-bg-color)',
                          position: 'absolute',
                          top: 3,
                          right: 3,
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </Flex>

            {/* Keyed by state, so switching tabs remounts the pickers rather
                than carrying one field's open popover over to another. */}
            <Stack space={3} key={state.key}>
              <Flex align="center" justify="space-between" gap={3}>
                <Text size={1}>Background</Text>
                <Box style={{minWidth: 0}}>
                  <ColorInput
                    value={vals[state.background]}
                    onChange={(v) => write(state.background, v)}
                    placeholder={state.key === 'hover' ? 'Same as Normal' : 'Variant default'}
                  />
                </Box>
              </Flex>
              <Flex align="center" justify="space-between" gap={3}>
                <Text size={1}>Text</Text>
                <Box style={{minWidth: 0}}>
                  <ColorInput
                    value={vals[state.text]}
                    onChange={(v) => write(state.text, v)}
                    placeholder={state.key === 'hover' ? 'Same as Normal' : 'Variant default'}
                  />
                </Box>
              </Flex>
              <Text size={0} muted>
                {state.key === 'hover'
                  ? 'Applied while the pointer is over the button. Empty keeps the Normal color, or the Variant’s own hover if Normal is empty too.'
                  : 'Empty uses the chosen Variant’s color.'}
              </Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>

      {renderDefault({...props, members: after})}
    </Stack>
  )
}
