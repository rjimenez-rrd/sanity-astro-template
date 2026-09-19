import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text} from '@sanity/ui'
import {SPACING_OPTIONS} from '../schemaTypes/shared/constants'

// Desktop-first, matching the container Layout tab: the '' key is the base that
// applies at every width, Tablet/Mobile are max-width overrides below it.
const BREAKPOINTS = [
  {key: '', label: 'Desktop', icon: '💻', width: '1024px'},
  {key: 'Tablet', label: 'Tablet', icon: '📱', width: '1024px'},
  {key: 'Mobile', label: 'Mobile', icon: '📱', width: '767px'},
] as const

function SpacingSelect({
  value,
  inherited,
  onChange,
}: {
  value?: string
  inherited?: string
  onChange: (v: string) => void
}) {
  // The inherited value is overlaid rather than used as the empty option's
  // label, so the dropdown still reads "—" for "clear this override".
  const showInherited = !value && Boolean(inherited)

  return (
    <div style={{position: 'relative', width: 60}}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '3px 2px',
          fontSize: 11,
          fontFamily: 'inherit',
          border: '1px solid var(--card-border-color)',
          borderRadius: 4,
          backgroundColor: 'var(--card-bg-color)',
          color: value
            ? 'var(--card-fg-color)'
            : showInherited
              ? 'transparent'
              : 'var(--card-muted-fg-color)',
          textAlign: 'center',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        <option value="">—</option>
        {SPACING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.title}
          </option>
        ))}
      </select>
      {showInherited && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--card-muted-fg-color)',
            pointerEvents: 'none',
          }}
        >
          {inherited}
        </span>
      )}
    </div>
  )
}

export function SpacingInput(props: ObjectInputProps) {
  const {onChange, value, schemaType} = props
  const vals = (value ?? {}) as Record<string, string | undefined>
  const title = schemaType.title ?? 'Spacing'
  const isPadding = schemaType.name === 'padding' || title.toLowerCase().includes('padding')

  // Opens on the base regardless of tab order: values typed here apply at every
  // width, whereas the Md/Lg tabs only override above their breakpoint.
  const [activeBreakpoint, setActiveBreakpoint] = useState(
    BREAKPOINTS.findIndex((b) => b.key === ''),
  )
  const bp = BREAKPOINTS[activeBreakpoint]
  const suffix = bp.key // '', 'Md', 'Lg'

  const fieldTop = `top${suffix}`
  const fieldRight = `right${suffix}`
  const fieldBottom = `bottom${suffix}`
  const fieldLeft = `left${suffix}`

  /**
   * Desktop-first, mirroring the max-width rules in the frontend's global.css:
   * an unset Mobile value falls back to Tablet, then to the Desktop base.
   * Desktop is the base itself, so it inherits nothing.
   */
  const inheritedFor = (side: string) => {
    const chain = suffix === 'Mobile' ? ['Tablet', ''] : suffix === 'Tablet' ? [''] : []
    for (const from of chain) {
      const v = vals[`${side}${from}`]
      if (v) return v
    }
    return undefined
  }

  const handleChange = useCallback(
    (side: string, newValue: string) => {
      if (newValue === '') {
        onChange(unset([side]))
      } else {
        onChange(set(newValue, [side]))
      }
    },
    [onChange],
  )

  // Keyed off the breakpoint rather than tab position, so the dot stays correct
  // regardless of the order BREAKPOINTS are displayed in.
  const hasValuesFor = (s: string) =>
    Boolean(vals[`top${s}`] || vals[`right${s}`] || vals[`bottom${s}`] || vals[`left${s}`])

  const ALL_FIELDS = [
    'top', 'right', 'bottom', 'left',
    'topTablet', 'rightTablet', 'bottomTablet', 'leftTablet',
    'topMobile', 'rightMobile', 'bottomMobile', 'leftMobile',
  ] as const

  const hasValues = ALL_FIELDS.some((f) => vals[f])

  const handleClear = useCallback(() => {
    onChange(ALL_FIELDS.map((f) => unset([f])))
  }, [onChange])

  const outerColor = isPadding
    ? 'rgba(124, 179, 66, 0.12)'
    : 'rgba(255, 167, 38, 0.12)'

  const labelColor = isPadding
    ? 'rgba(124, 179, 66, 0.7)'
    : 'rgba(255, 167, 38, 0.7)'

  return (
    <Card padding={2} radius={2} border tone="transparent">
      {/* Breakpoint toggle */}
      <Flex
        gap={0}
        style={{marginBottom: 6}}
      >
        {BREAKPOINTS.map((bpItem, i) => {
          const isActive = i === activeBreakpoint
          return (
            <button
              key={bpItem.key}
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
                  i === 0
                    ? '4px 0 0 4px'
                    : i === BREAKPOINTS.length - 1
                      ? '0 4px 4px 0'
                      : '0',
                backgroundColor: isActive
                  ? 'var(--card-badge-primary-bg-color)'
                  : 'var(--card-bg-color)',
                color: isActive
                  ? 'var(--card-badge-primary-fg-color)'
                  : 'var(--card-fg-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{bpItem.icon}</span>
              <span>{bpItem.label}</span>
              {/* Dot indicator for set values */}
              {hasValuesFor(bpItem.key) && !isActive && (
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

      {/* Breakpoint info */}
      <Flex justify="center" style={{marginBottom: 4}}>
        <Text size={0} muted style={{fontSize: 10}}>
          {bp.key === ''
            ? 'Base styles (all screens)'
            : `Overrides at ≤${bp.width} · empty inherits`}
        </Text>
      </Flex>

      {/* Box model */}
      <div
        style={{
          position: 'relative',
          backgroundColor: outerColor,
          borderRadius: 6,
          padding: 4,
        }}
      >
        {/* Title label */}
        <Flex align="center" justify="space-between" style={{position: 'absolute', top: 4, left: 8, right: 8}}>
          <Text
            size={0}
            style={{
              color: labelColor,
              fontWeight: 600,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
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

        {/* Top */}
        <Flex justify="center" style={{paddingTop: 18, paddingBottom: 4}}>
          <SpacingSelect
            value={vals[fieldTop]}
            inherited={inheritedFor('top')}
            onChange={(v) => handleChange(fieldTop, v)}
          />
        </Flex>

        {/* Middle: left + content + right */}
        <Flex align="center" justify="center" gap={2}>
          <SpacingSelect
            value={vals[fieldLeft]}
            inherited={inheritedFor('left')}
            onChange={(v) => handleChange(fieldLeft, v)}
          />

          <div
            style={{
              flex: 1,
              maxWidth: 140,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isPadding ? 'var(--card-bg-color)' : outerColor,
              border: isPadding
                ? '1.5px dashed var(--card-border-color)'
                : '1.5px dashed rgba(255, 167, 38, 0.3)',
              borderRadius: 4,
            }}
          >
            <Text size={0} muted style={{fontSize: 10}}>
              {isPadding ? 'content' : 'padding'}
            </Text>
          </div>

          <SpacingSelect
            value={vals[fieldRight]}
            inherited={inheritedFor('right')}
            onChange={(v) => handleChange(fieldRight, v)}
          />
        </Flex>

        {/* Bottom */}
        <Flex justify="center" style={{paddingTop: 4, paddingBottom: 4}}>
          <SpacingSelect
            value={vals[fieldBottom]}
            inherited={inheritedFor('bottom')}
            onChange={(v) => handleChange(fieldBottom, v)}
          />
        </Flex>
      </div>
    </Card>
  )
}
