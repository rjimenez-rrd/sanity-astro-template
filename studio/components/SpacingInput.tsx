import {useCallback, useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, TextInput} from '@sanity/ui'
import {LinkIcon, UnlinkIcon} from '@sanity/icons'

const UNITS = ['px', '%', 'em', 'rem', 'vh', 'vw'] as const
const DEFAULT_UNIT = 'px'

// Desktop-first, matching the max-width rules in the frontend's global.css:
// '' is the base, Tablet/Mobile override below their breakpoint.
const BREAKPOINTS = [
  {key: '', label: 'Desktop', icon: '💻', width: '1024px'},
  {key: 'Tablet', label: 'Tablet', icon: '📱', width: '1024px'},
  {key: 'Mobile', label: 'Mobile', icon: '📱', width: '767px'},
] as const

const SIDES = ['top', 'right', 'bottom', 'left'] as const

const VALUE_RE = /^(-?\d+(?:\.\d+)?)(px|%|em|rem|vh|vw)$/

function parseValue(raw?: string): {num: number; unit: string} | undefined {
  const match = VALUE_RE.exec(raw?.trim() ?? '')
  return match ? {num: Number(match[1]), unit: match[2]} : undefined
}

/**
 * Module scope on purpose. Defined inside SpacingInput this would be a new
 * component type on every render, so React would remount the input on each
 * keystroke and the field would lose focus mid-edit.
 */
function SideInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (raw: string) => void
}) {
  return (
    <div style={{width: 62}}>
      <TextInput
        type="number"
        fontSize={1}
        padding={2}
        radius={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
        aria-label={label}
        style={{textAlign: 'center'}}
      />
    </div>
  )
}

export function SpacingInput(props: ObjectInputProps) {
  const {onChange, value, schemaType} = props
  const vals = (value ?? {}) as Record<string, string | boolean | undefined>
  const title = schemaType.title ?? 'Spacing'
  const isPadding = schemaType.name === 'padding' || title.toLowerCase().includes('padding')

  const [activeBreakpoint, setActiveBreakpoint] = useState(0)
  const bp = BREAKPOINTS[activeBreakpoint]
  const suffix = bp.key
  // Linked unless explicitly turned off, so the common case of one value on all
  // four sides needs no extra click. Unset means linked, not unlinked.
  const linked = vals.linked !== false

  const str = (key: string) => (typeof vals[key] === 'string' ? (vals[key] as string) : undefined)

  const ALL_FIELDS = BREAKPOINTS.flatMap((b) => SIDES.map((s) => `${s}${b.key}`))

  /**
   * Desktop-first: an unset Mobile value falls back to Tablet, then to the
   * Desktop base. Desktop is the base itself, so it inherits nothing.
   */
  const inheritedFor = (side: string) => {
    const chain = suffix === 'Mobile' ? ['Tablet', ''] : suffix === 'Tablet' ? [''] : []
    for (const from of chain) {
      const v = str(`${side}${from}`)
      if (v) return v
    }
    return undefined
  }

  // The unit shown is whichever the current values already use.
  const unit =
    SIDES.map((s) => parseValue(str(`${s}${suffix}`))?.unit).find(Boolean) ??
    SIDES.map((s) => parseValue(inheritedFor(s))?.unit).find(Boolean) ??
    DEFAULT_UNIT

  const write = useCallback(
    (side: string, raw: string, nextUnit: string) => {
      const trimmed = raw.trim()
      const targets = linked ? SIDES.map((s) => `${s}${suffix}`) : [`${side}${suffix}`]
      if (trimmed === '' || trimmed === '-') {
        onChange(targets.map((t) => unset([t])) as FormPatch[])
        return
      }
      const n = Number(trimmed)
      if (!Number.isFinite(n)) return
      onChange(targets.map((t) => set(`${n}${nextUnit}`, [t])) as FormPatch[])
    },
    [onChange, linked, suffix],
  )

  const changeUnit = useCallback(
    (nextUnit: string) => {
      const ops: FormPatch[] = []
      for (const side of SIDES) {
        const key = `${side}${suffix}`
        const parsed = parseValue(str(key))
        if (parsed) ops.push(set(`${parsed.num}${nextUnit}`, [key]))
      }
      if (ops.length > 0) onChange(ops)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, suffix, vals],
  )

  const toggleLink = useCallback(() => {
    onChange(set(!linked, ['linked']))
  }, [onChange, linked])

  const clear = useCallback(() => {
    onChange(ALL_FIELDS.map((f) => unset([f])) as FormPatch[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange])

  const hasValues = ALL_FIELDS.some((f) => str(f))
  const hasValuesFor = (s: string) => SIDES.some((side) => str(`${side}${s}`))

  const outerColor = isPadding ? 'rgba(124, 179, 66, 0.12)' : 'rgba(255, 167, 38, 0.12)'
  const labelColor = isPadding ? 'rgba(124, 179, 66, 0.7)' : 'rgba(255, 167, 38, 0.7)'

  const sideProps = (side: string) => {
    const own = parseValue(str(`${side}${suffix}`))
    const inherited = parseValue(inheritedFor(side))
    return {
      label: `${title} ${side}`,
      value: own ? String(own.num) : '',
      placeholder: inherited ? String(inherited.num) : '—',
      onChange: (raw: string) => write(side, raw, unit),
    }
  }

  return (
    <Card padding={2} radius={2} border tone="transparent">
      {/* Breakpoint toggle */}
      <Flex gap={0} style={{marginBottom: 6}}>
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
                color: isActive ? 'var(--card-badge-primary-fg-color)' : 'var(--card-fg-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                position: 'relative',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
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

      <Flex justify="center" style={{marginBottom: 4}}>
        <Text size={0} muted style={{fontSize: 10}}>
          {suffix === ''
            ? 'Base styles (all screens)'
            : `Overrides at ≤${bp.width} · empty inherits`}
        </Text>
      </Flex>

      {/* Box model */}
      <div style={{position: 'relative', backgroundColor: outerColor, borderRadius: 6, padding: 4}}>
        <Flex
          align="center"
          justify="space-between"
          style={{position: 'absolute', top: 4, left: 8, right: 8}}
        >
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
          <Flex align="center" gap={2}>
            <select
              value={unit}
              onChange={(e) => changeUnit(e.target.value)}
              style={{
                fontSize: 10,
                fontFamily: 'inherit',
                padding: '1px 2px',
                borderRadius: 3,
                border: '1px solid var(--card-border-color)',
                backgroundColor: 'var(--card-bg-color)',
                color: 'var(--card-fg-color)',
                cursor: 'pointer',
              }}
              aria-label="Unit"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleLink}
              title={linked ? 'Sides linked — click to edit each separately' : 'Link all four sides'}
              aria-pressed={linked}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                borderRadius: 3,
                border: '1px solid var(--card-border-color)',
                backgroundColor: linked
                  ? 'var(--card-badge-primary-bg-color)'
                  : 'var(--card-bg-color)',
                color: linked ? 'var(--card-badge-primary-fg-color)' : 'var(--card-muted-fg-color)',
                cursor: 'pointer',
              }}
            >
              {linked ? <LinkIcon /> : <UnlinkIcon />}
            </button>
            {hasValues && (
              <button
                type="button"
                onClick={clear}
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
        </Flex>

        <Flex justify="center" style={{paddingTop: 20, paddingBottom: 4}}>
          <SideInput {...sideProps('top')} />
        </Flex>

        <Flex align="center" justify="center" gap={2}>
          <SideInput {...sideProps('left')} />
          <div
            style={{
              flex: 1,
              maxWidth: 130,
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
          <SideInput {...sideProps('right')} />
        </Flex>

        <Flex justify="center" style={{paddingTop: 4, paddingBottom: 4}}>
          <SideInput {...sideProps('bottom')} />
        </Flex>
      </div>
    </Card>
  )
}
