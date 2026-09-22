import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {SliderInput} from '../container/controls'

const UNITS = ['px', '%', 'rem', 'em', 'vw'] as const

/** Keeps the slider useful per unit, and matches the Layout tab's px ceiling. */
const MAX_BY_UNIT: Record<string, number> = {px: 1600, '%': 100, rem: 100, em: 100, vw: 100}

// Desktop-first, matching the spacing fields and the max-width rules in the
// frontend's global.css: '' is the base, Tablet/Mobile override below it.
const BREAKPOINTS = [
  {key: '', label: 'Desktop', width: '1024px'},
  {key: 'Tablet', label: 'Tablet', width: '1024px'},
  {key: 'Mobile', label: 'Mobile', width: '767px'},
] as const

const ALIGNS = [
  {value: 'start', label: 'Start'},
  {value: 'center', label: 'Center'},
  {value: 'end', label: 'End'},
] as const

const ALL_FIELDS = [
  'width', 'widthTablet', 'widthMobile',
  'height', 'heightTablet', 'heightMobile',
  'align', 'alignTablet', 'alignMobile',
] as const

/**
 * A block keeps its natural height however tall its column grows. "Fill" swaps
 * that for flex: 1 1 auto in the frontend, so the block — and the image or map
 * inside it — matches the tallest column in the row.
 */
const HEIGHT_MODES = [
  {value: 'auto', label: 'Auto'},
  {value: 'fill', label: 'Fill column'},
  {value: 'custom', label: 'Custom'},
] as const

const DEFAULT_CUSTOM_HEIGHT = 300

const WIDTH_RE = /^(\d+(?:\.\d+)?)(px|%|rem|em|vw)$/

function parseWidth(raw?: string): {num?: number; unit: string} {
  const match = WIDTH_RE.exec(raw?.trim() ?? '')
  return match ? {num: Number(match[1]), unit: match[2]} : {unit: 'px'}
}

export function SizeInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const vals = (value ?? {}) as Record<string, string | undefined>

  const [activeBreakpoint, setActiveBreakpoint] = useState(0)
  const bp = BREAKPOINTS[activeBreakpoint]
  const suffix = bp.key

  const widthKey = `width${suffix}`
  const heightKey = `height${suffix}`
  const alignKey = `align${suffix}`

  /**
   * Desktop-first: an unset Mobile value falls back to Tablet, then to the
   * Desktop base. Desktop is the base itself, so it inherits nothing.
   */
  const inheritedFor = useCallback(
    (field: 'width' | 'height' | 'align') => {
      const chain = suffix === 'Mobile' ? ['Tablet', ''] : suffix === 'Tablet' ? [''] : []
      for (const from of chain) {
        const v = vals[`${field}${from}`]
        if (v) return v
      }
      return undefined
    },
    [suffix, vals],
  )

  const inheritedWidth = inheritedFor('width')
  const inheritedHeight = inheritedFor('height')
  const inheritedAlign = inheritedFor('align')

  const own = parseWidth(vals[widthKey])
  const shown = vals[widthKey] ? own : parseWidth(inheritedWidth)
  const unit = shown.unit
  const max = MAX_BY_UNIT[unit] ?? 1600

  const writeWidth = useCallback(
    (next: number | undefined, nextUnit: string) => {
      if (next === undefined) {
        onChange(unset([widthKey]))
        return
      }
      const clamped = Math.min(next, MAX_BY_UNIT[nextUnit] ?? 1600)
      onChange(set(`${clamped}${nextUnit}`, [widthKey]))
    },
    [onChange, widthKey],
  )

  // Shown value falls back to whatever this breakpoint inherits, like width.
  const shownHeight = vals[heightKey] ?? inheritedHeight
  const heightMode = shownHeight === 'fill' ? 'fill' : shownHeight ? 'custom' : 'auto'
  const customHeight = heightMode === 'custom' ? parseWidth(shownHeight).num : undefined

  const setHeightMode = useCallback(
    (mode: string) => {
      if (mode === 'auto') onChange(unset([heightKey]))
      else if (mode === 'fill') onChange(set('fill', [heightKey]))
      else onChange(set(`${customHeight ?? DEFAULT_CUSTOM_HEIGHT}px`, [heightKey]))
    },
    [onChange, heightKey, customHeight],
  )

  const writeHeight = useCallback(
    (next: number | undefined) => {
      onChange(next === undefined ? unset([heightKey]) : set(`${next}px`, [heightKey]))
    },
    [onChange, heightKey],
  )

  const setAlign = useCallback(
    (next: string) => {
      onChange(vals[alignKey] === next ? unset([alignKey]) : set(next, [alignKey]))
    },
    [onChange, alignKey, vals],
  )

  const clear = useCallback(() => {
    onChange(ALL_FIELDS.map((f) => unset([f])))
  }, [onChange])

  const hasValues = ALL_FIELDS.some((f) => vals[f])
  const hasValuesFor = (s: string) =>
    Boolean(vals[`width${s}`] || vals[`height${s}`] || vals[`align${s}`])

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={4}>
        <Stack space={2}>
          <Flex gap={0}>
            {BREAKPOINTS.map((item, i) => {
              const isActive = i === activeBreakpoint
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveBreakpoint(i)}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderLeft: i > 0 ? 'none' : undefined,
                    borderRadius:
                      i === 0 ? '4px 0 0 4px' : i === BREAKPOINTS.length - 1 ? '0 4px 4px 0' : '0',
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
                  {hasValuesFor(item.key) && !isActive && (
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
          <Flex justify="center">
            <Text size={0} muted style={{fontSize: 10}}>
              {suffix === ''
                ? 'Base styles (all screens)'
                : `Overrides at ≤${bp.width} · empty inherits`}
            </Text>
          </Flex>
        </Stack>

        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">
              Width
            </Text>
            <Flex align="center" gap={2}>
              <select
                value={unit}
                onChange={(e) => writeWidth(own.num ?? shown.num, e.target.value)}
                style={{
                  fontSize: 11,
                  fontFamily: 'inherit',
                  padding: '3px 4px',
                  borderRadius: 4,
                  border: '1px solid var(--card-border-color)',
                  backgroundColor: 'var(--card-bg-color)',
                  color: 'var(--card-fg-color)',
                  cursor: 'pointer',
                }}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {hasValues && (
                <button
                  type="button"
                  onClick={clear}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--card-muted-fg-color)',
                    fontSize: 11,
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  Clear
                </button>
              )}
            </Flex>
          </Flex>

          <SliderInput
            size={own.num}
            placeholder={shown.num}
            max={max}
            onChange={(next) => writeWidth(next, unit)}
          />

          <Text size={0} muted>
            {vals[widthKey]
              ? 'Empty fills the container.'
              : inheritedWidth
                ? `Inheriting ${inheritedWidth}.`
                : 'Empty fills the container.'}
          </Text>
        </Stack>

        <Stack space={3}>
          <Text size={1} weight="medium">
            Height
          </Text>
          <Flex gap={0}>
            {HEIGHT_MODES.map((option, i) => {
              const isActive = heightMode === option.value
              const isInherited = isActive && !vals[heightKey] && option.value !== 'auto'
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHeightMode(option.value)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderLeft: i > 0 ? 'none' : undefined,
                    borderRadius:
                      i === 0
                        ? '4px 0 0 4px'
                        : i === HEIGHT_MODES.length - 1
                          ? '0 4px 4px 0'
                          : '0',
                    backgroundColor: isActive
                      ? 'var(--card-badge-primary-bg-color)'
                      : 'var(--card-bg-color)',
                    color: isActive
                      ? 'var(--card-badge-primary-fg-color)'
                      : 'var(--card-fg-color)',
                    opacity: isInherited ? 0.55 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                  {isInherited ? ' *' : ''}
                </button>
              )
            })}
          </Flex>
          {heightMode === 'custom' && (
            <SliderInput
              size={parseWidth(vals[heightKey]).num}
              placeholder={customHeight}
              max={MAX_BY_UNIT.px}
              onChange={writeHeight}
            />
          )}
          <Box>
            <Text size={0} muted>
              {heightMode === 'fill'
                ? 'Matches the height of the tallest block in the row.'
                : heightMode === 'custom'
                  ? 'A fixed height in px. Images and maps crop to fit.'
                  : 'The block keeps its natural height.'}
            </Text>
          </Box>
        </Stack>

        <Stack space={3}>
          <Text size={1} weight="medium">
            Align
          </Text>
          <Flex gap={0}>
            {ALIGNS.map((option, i) => {
              const isOwn = vals[alignKey] === option.value
              const isInherited = !vals[alignKey] && inheritedAlign === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAlign(option.value)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    border: '1px solid var(--card-border-color)',
                    borderLeft: i > 0 ? 'none' : undefined,
                    borderRadius:
                      i === 0 ? '4px 0 0 4px' : i === ALIGNS.length - 1 ? '0 4px 4px 0' : '0',
                    backgroundColor:
                      isOwn || isInherited
                        ? 'var(--card-badge-primary-bg-color)'
                        : 'var(--card-bg-color)',
                    color:
                      isOwn || isInherited
                        ? 'var(--card-badge-primary-fg-color)'
                        : 'var(--card-fg-color)',
                    opacity: isInherited ? 0.55 : 1,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                  {isInherited ? ' *' : ''}
                </button>
              )
            })}
          </Flex>
          <Box>
            <Text size={0} muted>
              {inheritedAlign && !vals[alignKey]
                ? '* inherited — click to set it here.'
                : 'Where the block sits when it is narrower than the container.'}
            </Text>
          </Box>
        </Stack>
      </Stack>
    </Card>
  )
}
