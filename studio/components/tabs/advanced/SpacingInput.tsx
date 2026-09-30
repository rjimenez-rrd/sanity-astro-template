import {useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, unset} from 'sanity'
import {Button, Flex, Text, TextInput} from '@sanity/ui'
import {LinkIcon, UnlinkIcon} from '@sanity/icons'
import {ControlRow, UnitSelect} from '../../controls/controls'
import {DEVICES, resolveResponsive, type Device, type Responsive} from '../../controls/responsive'

/*
 * Margin and Padding: a box-model editor with one number per side, per device.
 *
 * Stored flat, one string per side and device ("20px", "-1.5rem"):
 * top/right/bottom/left for desktop, topTablet… and topMobile… for the
 * overrides, plus `linked`. Desktop-first, like the frontend's CSS: an empty
 * tablet or mobile side inherits from the next larger device.
 */

const UNITS = ['px', '%', 'em', 'rem', 'vh', 'vw'] as const
const DEFAULT_UNIT = 'px'
const SIDES = ['top', 'right', 'bottom', 'left'] as const
type Side = (typeof SIDES)[number]

const KEY_SUFFIX: Record<Device, string> = {desktop: '', tablet: 'Tablet', mobile: 'Mobile'}
const MAX_WIDTH: Record<Device, string | undefined> = {desktop: undefined, tablet: '1024px', mobile: '767px'}

/** The stored field for one side on one device: top, topTablet, topMobile… */
const fieldKey = (side: Side, device: Device) => `${side}${KEY_SUFFIX[device]}`
const ALL_KEYS = DEVICES.flatMap((device) => SIDES.map((side) => fieldKey(side, device)))

const VALUE_RE = /^(-?\d+(?:\.\d+)?)(px|%|em|rem|vh|vw)$/

function parseValue(raw?: string): {num: number; unit: string} | undefined {
  const match = VALUE_RE.exec(raw?.trim() ?? '')
  return match ? {num: Number(match[1]), unit: match[2]} : undefined
}

// Margin in orange, padding in green, as in browser dev tools.
const COLORS = {
  margin: {box: 'rgba(255, 167, 38, 0.12)', inner: 'rgba(255, 167, 38, 0.3)'},
  padding: {box: 'rgba(124, 179, 66, 0.12)', inner: 'var(--card-border-color)'},
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
  const values = (value ?? {}) as Record<string, unknown>
  const title = schemaType.title ?? 'Spacing'
  // Set by spacingField: padding or margin.
  const kind = (schemaType.options as {kind?: string} | undefined)?.kind === 'padding' ? 'padding' : 'margin'
  const colors = COLORS[kind]

  const [device, setDevice] = useState<Device>('desktop')
  // Linked unless explicitly turned off, so the common case of one value on all
  // four sides needs no extra click. Unset means linked, not unlinked.
  const linked = values.linked !== false

  const stored = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : undefined)

  /** One side on the current device: its own value, and the one it falls back to. */
  const sideState = (side: Side) => {
    const perDevice: Responsive<string> = {
      desktop: stored(fieldKey(side, 'desktop')),
      tablet: stored(fieldKey(side, 'tablet')),
      mobile: stored(fieldKey(side, 'mobile')),
    }
    const {value: effective, inherited} = resolveResponsive(perDevice, device)
    return {
      own: parseValue(stored(fieldKey(side, device))),
      fallback: inherited ? parseValue(effective) : undefined,
    }
  }

  // The unit shown is whichever the current values already use.
  const unit =
    SIDES.map((side) => sideState(side).own?.unit).find(Boolean) ??
    SIDES.map((side) => sideState(side).fallback?.unit).find(Boolean) ??
    DEFAULT_UNIT

  /** Typing a number: sets this side, or all four while linked. Empty clears. */
  const writeSide = (side: Side, raw: string) => {
    const targets = linked ? SIDES.map((s) => fieldKey(s, device)) : [fieldKey(side, device)]
    const trimmed = raw.trim()
    if (trimmed === '' || trimmed === '-') {
      onChange(targets.map((key) => unset([key])) as FormPatch[])
      return
    }
    const n = Number(trimmed)
    if (Number.isFinite(n)) onChange(targets.map((key) => set(`${n}${unit}`, [key])) as FormPatch[])
  }

  /** A new unit keeps the numbers of this device's sides, e.g. 20px -> 20rem. */
  const changeUnit = (nextUnit: string) => {
    const patches = SIDES.flatMap((side) => {
      const own = sideState(side).own
      return own ? [set(`${own.num}${nextUnit}`, [fieldKey(side, device)])] : []
    })
    if (patches.length > 0) onChange(patches)
  }

  const clearAll = () => onChange(ALL_KEYS.map((key) => unset([key])) as FormPatch[])
  const hasValues = ALL_KEYS.some((key) => stored(key))

  const sideInput = (side: Side) => {
    const {own, fallback} = sideState(side)
    return (
      <SideInput
        label={`${title} ${side}`}
        value={own ? String(own.num) : ''}
        placeholder={fallback ? String(fallback.num) : '—'}
        onChange={(raw) => writeSide(side, raw)}
      />
    )
  }

  const maxWidth = MAX_WIDTH[device]

  return (
    <ControlRow
      label={title}
      stacked
      responsive={{device, onDevice: setDevice}}
      hint={maxWidth ? `Applies at ${maxWidth} and narrower. Empty sides inherit.` : undefined}
      aside={
        <Flex align="center" gap={1}>
          <UnitSelect unit={unit} units={UNITS} onChange={changeUnit} />
          <Button
            mode={linked ? 'default' : 'ghost'}
            tone={linked ? 'primary' : 'default'}
            padding={2}
            fontSize={1}
            icon={linked ? LinkIcon : UnlinkIcon}
            title={linked ? 'Sides linked — click to edit each separately' : 'Link all four sides'}
            aria-pressed={linked}
            onClick={() => onChange(set(!linked, ['linked']))}
          />
          {hasValues && <Button mode="bleed" padding={2} fontSize={1} text="Clear" onClick={clearAll} />}
        </Flex>
      }
    >
      {/* Box model: the four sides around a box standing for what's inside. */}
      <div style={{backgroundColor: colors.box, borderRadius: 6, padding: '8px 4px'}}>
        <Flex justify="center" style={{paddingBottom: 4}}>
          {sideInput('top')}
        </Flex>
        <Flex align="center" justify="center" gap={2}>
          {sideInput('left')}
          <div
            style={{
              flex: 1,
              maxWidth: 130,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: kind === 'padding' ? 'var(--card-bg-color)' : colors.box,
              border: `1.5px dashed ${colors.inner}`,
              borderRadius: 4,
            }}
          >
            <Text size={0} muted>
              {kind === 'padding' ? 'content' : 'padding'}
            </Text>
          </div>
          {sideInput('right')}
        </Flex>
        <Flex justify="center" style={{paddingTop: 4}}>
          {sideInput('bottom')}
        </Flex>
      </div>
    </ControlRow>
  )
}
