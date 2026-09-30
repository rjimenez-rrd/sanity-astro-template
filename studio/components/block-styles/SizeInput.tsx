import {useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, unset} from 'sanity'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {ControlRow, IconToggleGroup, SliderInput, UnitSelect, type IconOption} from '../controls/controls'
import {JustifyCenterIcon, JustifyEndIcon, JustifyStartIcon} from '../controls/icons'
import {DEVICES, resolveResponsive, type Device} from '../controls/responsive'

/*
 * Size & Alignment: width, height and horizontal placement of a block, per
 * device.
 *
 * Stored flat, one string per field and device: width/height/align for
 * desktop, widthTablet… and widthMobile… for the overrides. Desktop-first,
 * matching the spacing fields and the max-width rules in the frontend's
 * global.css: an empty tablet or mobile value inherits from the next larger
 * device.
 */

const UNITS = ['px', '%', 'rem', 'em', 'vw'] as const
const DEFAULT_UNIT = 'px'

/** Keeps the slider useful per unit, and matches the Layout tab's px ceiling. */
const MAX_BY_UNIT: Record<string, number> = {px: 1600, '%': 100, rem: 100, em: 100, vw: 100}

const FIELDS = ['width', 'height', 'align'] as const
type Field = (typeof FIELDS)[number]

const KEY_SUFFIX: Record<Device, string> = {desktop: '', tablet: 'Tablet', mobile: 'Mobile'}
const MAX_WIDTH: Record<Device, string | undefined> = {desktop: undefined, tablet: '1024px', mobile: '767px'}

/** The stored field for one property on one device: width, widthTablet, widthMobile… */
const fieldKey = (field: Field, device: Device) => `${field}${KEY_SUFFIX[device]}`
const ALL_KEYS = FIELDS.flatMap((field) => DEVICES.map((device) => fieldKey(field, device)))

const ALIGNS: IconOption[] = [
  {value: 'start', title: 'Start', icon: <JustifyStartIcon />},
  {value: 'center', title: 'Center', icon: <JustifyCenterIcon />},
  {value: 'end', title: 'End', icon: <JustifyEndIcon />},
]

/**
 * A block keeps its natural height however tall its column grows. "Fill" swaps
 * that for flex: 1 1 auto in the frontend, so the block — and the image or map
 * inside it — matches the tallest column in the row.
 */
const HEIGHT_MODES: IconOption[] = [
  {value: 'auto', title: 'Auto', icon: <Text size={1}>Auto</Text>},
  {value: 'fill', title: 'Fill column', icon: <Text size={1}>Fill column</Text>},
  {value: 'custom', title: 'Custom', icon: <Text size={1}>Custom</Text>},
]

const HEIGHT_NOTES: Record<string, string> = {
  auto: 'The block keeps its natural height.',
  fill: 'Matches the height of the tallest block in the row.',
  custom: 'A fixed height in px. Images and maps crop to fit.',
}

const DEFAULT_CUSTOM_HEIGHT = 300

const LENGTH_RE = /^(\d+(?:\.\d+)?)(px|%|rem|em|vw)$/

function parseLength(raw?: string): {num?: number; unit: string} {
  const match = LENGTH_RE.exec(raw?.trim() ?? '')
  return match ? {num: Number(match[1]), unit: match[2]} : {unit: DEFAULT_UNIT}
}

export function SizeInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const values = (value ?? {}) as Record<string, string | undefined>
  const [device, setDevice] = useState<Device>('desktop')

  const widthKey = fieldKey('width', device)
  const heightKey = fieldKey('height', device)
  const alignKey = fieldKey('align', device)

  /** What this device inherits for a field; undefined when it has its own value or nothing above it. */
  const inheritedFor = (field: Field) => {
    const {value: effective, inherited} = resolveResponsive(
      {
        desktop: values[fieldKey(field, 'desktop')],
        tablet: values[fieldKey(field, 'tablet')],
        mobile: values[fieldKey(field, 'mobile')],
      },
      device,
    )
    return inherited ? effective : undefined
  }

  // Width: the unit shown is this device's own, else the inherited value's.
  const inheritedWidth = inheritedFor('width')
  const ownWidth = parseLength(values[widthKey])
  const shownWidth = values[widthKey] ? ownWidth : parseLength(inheritedWidth)
  const unit = shownWidth.unit

  const writeWidth = (next: number | undefined, nextUnit: string) => {
    if (next === undefined) {
      onChange(unset([widthKey]))
      return
    }
    const clamped = Math.min(next, MAX_BY_UNIT[nextUnit] ?? MAX_BY_UNIT.px)
    onChange(set(`${clamped}${nextUnit}`, [widthKey]))
  }

  // Height: stored as a length or the token "fill"; unset means auto. The
  // shown mode falls back to whatever this device inherits, like width.
  const shownHeight = values[heightKey] ?? inheritedFor('height')
  const heightMode = shownHeight === 'fill' ? 'fill' : shownHeight ? 'custom' : 'auto'
  const customHeight = heightMode === 'custom' ? parseLength(shownHeight).num : undefined

  const setHeightMode = (mode: string) => {
    if (mode === 'auto') onChange(unset([heightKey]))
    else if (mode === 'fill') onChange(set('fill', [heightKey]))
    else onChange(set(`${customHeight ?? DEFAULT_CUSTOM_HEIGHT}px`, [heightKey]))
  }

  const writeHeight = (next: number | undefined) =>
    onChange(next === undefined ? unset([heightKey]) : set(`${next}px`, [heightKey]))

  const inheritedAlign = values[alignKey] ? undefined : inheritedFor('align')

  const clearAll = () => onChange(ALL_KEYS.map((key) => unset([key])) as FormPatch[])
  const hasValues = ALL_KEYS.some((key) => values[key])

  const maxWidth = MAX_WIDTH[device]
  const widthNote = !values[widthKey] && inheritedWidth ? `Inheriting ${inheritedWidth}.` : 'Empty fills the container.'
  const responsive = {device, onDevice: setDevice}

  return (
    <Stack space={4}>
      <ControlRow
        label="Width"
        stacked
        responsive={responsive}
        hint={maxWidth ? `Applies at ${maxWidth} and narrower. ${widthNote}` : widthNote}
        aside={
          <Flex align="center" gap={1}>
            <UnitSelect
              unit={unit}
              units={UNITS}
              onChange={(nextUnit) => writeWidth(ownWidth.num ?? shownWidth.num, nextUnit)}
            />
            {hasValues && <Button mode="bleed" padding={2} fontSize={1} text="Clear" onClick={clearAll} />}
          </Flex>
        }
      >
        <SliderInput
          size={ownWidth.num}
          placeholder={shownWidth.num}
          max={MAX_BY_UNIT[unit] ?? MAX_BY_UNIT.px}
          onChange={(next) => writeWidth(next, unit)}
        />
      </ControlRow>

      <ControlRow label="Height" stacked responsive={responsive} hint={HEIGHT_NOTES[heightMode]}>
        <Stack space={3}>
          <IconToggleGroup
            fill
            options={HEIGHT_MODES}
            value={heightMode}
            inherited={!values[heightKey] && heightMode !== 'auto'}
            // Clicking the mode already set here re-applies it, rather than clearing.
            onChange={(next) => setHeightMode(next ?? heightMode)}
          />
          {heightMode === 'custom' && (
            <SliderInput
              size={parseLength(values[heightKey]).num}
              placeholder={customHeight}
              max={MAX_BY_UNIT.px}
              onChange={writeHeight}
            />
          )}
        </Stack>
      </ControlRow>

      <ControlRow
        label="Align"
        responsive={responsive}
        hint={
          inheritedAlign
            ? 'Inherited from a larger screen — click to set it here.'
            : 'Where the block sits when it is narrower than the container.'
        }
      >
        <IconToggleGroup
          options={ALIGNS}
          value={values[alignKey] || inheritedAlign}
          inherited={Boolean(inheritedAlign)}
          onChange={(next) => onChange(next === undefined ? unset([alignKey]) : set(next, [alignKey]))}
        />
      </ControlRow>
    </Stack>
  )
}
