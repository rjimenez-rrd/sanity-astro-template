import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, Stack} from '@sanity/ui'
import {ColorInput, CompactSelect} from './BorderStyleInput'

// Desktop-first, matching spacing and the max-width rules in global.css.
const BREAKPOINTS = [
  {key: '', label: 'Desktop'},
  {key: 'Tablet', label: 'Tablet'},
  {key: 'Mobile', label: 'Mobile'},
] as const

const FONT_SIZES = [
  {title: '12px', value: '12'},
  {title: '14px', value: '14'},
  {title: '16px', value: '16'},
  {title: '18px', value: '18'},
  {title: '20px', value: '20'},
  {title: '24px', value: '24'},
  {title: '30px', value: '30'},
  {title: '36px', value: '36'},
  {title: '48px', value: '48'},
  {title: '60px', value: '60'},
  {title: '72px', value: '72'},
]

const ALIGN_OPTIONS = [
  {value: 'left', label: '≡ Left'},
  {value: 'center', label: '≡ Center'},
  {value: 'right', label: '≡ Right'},
] as const

export function TypographyInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const vals = (value ?? {}) as Record<string, string | undefined>

  const handleChange = useCallback(
    (field: string, newValue: string) => {
      onChange(newValue === '' ? unset([field]) : set(newValue, [field]))
    },
    [onChange],
  )

  const [activeBreakpoint, setActiveBreakpoint] = useState(0)
  const suffix = BREAKPOINTS[activeBreakpoint].key
  const alignKey = `textAlign${suffix}`
  const fontSizeKey = `fontSize${suffix}`
  const ownFontSize = vals[fontSizeKey]

  /** Desktop-first: Mobile falls back to Tablet, then to the Desktop base. */
  const inheritedFor = useCallback(
    (field: 'textAlign' | 'fontSize') => {
      const chain = suffix === 'Mobile' ? ['Tablet', ''] : suffix === 'Tablet' ? [''] : []
      for (const from of chain) {
        const v = vals[`${field}${from}`]
        if (v) return v
      }
      return undefined
    },
    [suffix, vals],
  )
  const inheritedAlign = inheritedFor('textAlign')
  const inheritedFontSize = inheritedFor('fontSize')

  // Custom is sticky once picked, so typing a value doesn't bounce the field
  // back to the dropdown between keystrokes; a value already on the document
  // that isn't one of the presets (e.g. from before this existed) opens in
  // Custom the same way, with no click needed. Keyed off this breakpoint's own
  // value, not the inherited one — a Tablet override only ever writes to
  // fontSizeTablet, never the Desktop base it's shown next to.
  const isPreset = FONT_SIZES.some((f) => f.value === ownFontSize)
  const [forceCustom, setForceCustom] = useState(false)
  const showCustomSize = forceCustom || (!!ownFontSize && !isPreset)

  const handleFontSizeMode = useCallback(
    (mode: string) => {
      if (mode === 'custom') {
        setForceCustom(true)
        return
      }
      setForceCustom(false)
      handleChange(fontSizeKey, mode)
    },
    [handleChange, fontSizeKey],
  )

  const ALIGN_FIELDS = BREAKPOINTS.map((b) => `textAlign${b.key}`)
  const FONT_SIZE_FIELDS = BREAKPOINTS.map((b) => `fontSize${b.key}`)
  const hasValues = !!(
    ALIGN_FIELDS.some((f) => vals[f]) ||
    FONT_SIZE_FIELDS.some((f) => vals[f]) ||
    vals.textColor
  )

  const handleClear = useCallback(() => {
    onChange([
      ...ALIGN_FIELDS.map((f) => unset([f])),
      ...FONT_SIZE_FIELDS.map((f) => unset([f])),
      unset(['textColor']),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange])

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text
            size={0}
            weight="bold"
            muted
            style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}
          >
            Typography
          </Text>
          {hasValues && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--card-muted-fg-color)',
                fontSize: 10,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Clear
            </button>
          )}
        </Flex>

        {/* Which breakpoint the align buttons and size below write to. */}
        <Flex gap={0}>
          {BREAKPOINTS.map((item, i) => {
            const isActive = i === activeBreakpoint
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveBreakpoint(i)
                  // Custom mode is per-breakpoint only in effect, not in state —
                  // leaving it on would show the number input on a tab whose own
                  // value doesn't actually need it.
                  setForceCustom(false)
                }}
                style={{
                  flex: 1,
                  padding: '4px',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  border: '1px solid var(--card-border-color)',
                  borderLeft: i > 0 ? 'none' : undefined,
                  borderRadius:
                    i === 0 ? '4px 0 0 4px' : i === BREAKPOINTS.length - 1 ? '0 4px 4px 0' : '0',
                  backgroundColor: isActive
                    ? 'var(--card-badge-primary-bg-color)'
                    : 'var(--card-bg-color)',
                  color: isActive ? 'var(--card-badge-primary-fg-color)' : 'var(--card-fg-color)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {item.label}
                {(vals[`textAlign${item.key}`] || vals[`fontSize${item.key}`]) && !isActive && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'var(--card-badge-primary-bg-color)',
                      position: 'absolute',
                      top: 2,
                      right: 2,
                    }}
                  />
                )}
              </button>
            )
          })}
        </Flex>

        {/* Align buttons + font size */}
        <Flex gap={2} align="center">
          <Flex gap={0}>
            {ALIGN_OPTIONS.map((opt, i) => {
              const isSelected = vals[alignKey] === opt.value
              const isInherited = !vals[alignKey] && inheritedAlign === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(alignKey, isSelected ? '' : opt.value)}
                  title={isInherited ? `${opt.label} (inherited)` : opt.label}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderLeft: i > 0 ? 'none' : undefined,
                    borderRadius:
                      i === 0
                        ? '4px 0 0 4px'
                        : i === ALIGN_OPTIONS.length - 1
                          ? '0 4px 4px 0'
                          : '0',
                    backgroundColor:
                      isSelected || isInherited
                        ? 'var(--card-badge-primary-bg-color)'
                        : 'var(--card-bg-color)',
                    color:
                      isSelected || isInherited
                        ? 'var(--card-badge-primary-fg-color)'
                        : 'var(--card-fg-color)',
                    opacity: isInherited ? 0.55 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </Flex>

          <Flex align="center" gap={1}>
            <CompactSelect
              value={showCustomSize ? 'custom' : (ownFontSize ?? '')}
              placeholder={inheritedFontSize ? `${inheritedFontSize}px` : 'Size'}
              width={showCustomSize ? 90 : 80}
              options={[...FONT_SIZES, {title: 'Custom…', value: 'custom'}]}
              onChange={handleFontSizeMode}
            />
            {showCustomSize && (
              <>
                <input
                  type="number"
                  min={1}
                  autoFocus={forceCustom}
                  value={ownFontSize ?? ''}
                  placeholder={inheritedFontSize ?? 'Size'}
                  onChange={(e) => handleChange(fontSizeKey, e.target.value)}
                  style={{
                    width: 56,
                    padding: '6px 8px',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderRadius: 4,
                    backgroundColor: 'var(--card-bg-color)',
                    color: 'var(--card-fg-color)',
                    textAlign: 'center',
                  }}
                />
                <Text size={0} muted>
                  px
                </Text>
              </>
            )}
          </Flex>

          <ColorInput
            value={vals.textColor}
            placeholder="#333"
            onChange={(v) => handleChange('textColor', v)}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
