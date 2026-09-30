import {useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, unset} from 'sanity'
import {Box, Button, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {ControlRow, IconToggleGroup, type IconOption} from '../controls/controls'
import {ColorInput} from '../controls/ColorInput'
import {CompactSelect} from '../controls/CompactSelect'
import {DEVICES, resolveResponsive, type Device} from '../controls/responsive'
import {BUNDLED_FONTS} from '../../schemaTypes/fonts'

/*
 * Typography: text align and font size per device, plus one text color and a
 * heading font for the whole block.
 *
 * Stored flat as strings: textAlign/fontSize for desktop, textAlignTablet… and
 * textAlignMobile… for the overrides (font size is a bare number of px, "24").
 * Desktop-first, like spacing: an empty tablet or mobile value inherits from
 * the next larger device.
 */

const RESPONSIVE_FIELDS = ['textAlign', 'fontSize'] as const
type ResponsiveField = (typeof RESPONSIVE_FIELDS)[number]

const KEY_SUFFIX: Record<Device, string> = {desktop: '', tablet: 'Tablet', mobile: 'Mobile'}
const MAX_WIDTH: Record<Device, string | undefined> = {desktop: undefined, tablet: '1024px', mobile: '767px'}

/** The stored field for one property on one device: fontSize, fontSizeTablet… */
const fieldKey = (field: ResponsiveField, device: Device) => `${field}${KEY_SUFFIX[device]}`
const ALL_KEYS = [
  ...RESPONSIVE_FIELDS.flatMap((field) => DEVICES.map((device) => fieldKey(field, device))),
  'textColor',
  'headingFont',
]

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map((px) => ({
  title: `${px}px`,
  value: String(px),
}))
const CUSTOM = 'custom'
const FONT_SIZE_OPTIONS = [...FONT_SIZES, {title: 'Custom…', value: CUSTOM}]

const FONT_OPTIONS = BUNDLED_FONTS.map((font) => ({title: font, value: font}))

/** Four lines, ragged on the side opposite the alignment. */
function TextAlignIcon({align}: {align: 'left' | 'center' | 'right'}) {
  const line = (y: number, width: number) => {
    const x = align === 'left' ? 2 : align === 'right' ? 14 - width : 8 - width / 2
    return <path key={y} d={`M${x} ${y}h${width}`} />
  }
  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      {[line(3.5, 12), line(6.5, 8), line(9.5, 12), line(12.5, 8)]}
    </svg>
  )
}

const ALIGN_OPTIONS: IconOption[] = [
  {value: 'left', title: 'Left', icon: <TextAlignIcon align="left" />},
  {value: 'center', title: 'Center', icon: <TextAlignIcon align="center" />},
  {value: 'right', title: 'Right', icon: <TextAlignIcon align="right" />},
]

export function TypographyInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const values = (value ?? {}) as Record<string, string | undefined>
  const [device, setDevice] = useState<Device>('desktop')

  /** Empty clears the field rather than storing "". */
  const write = (key: string, next: string) => onChange(next === '' ? unset([key]) : set(next, [key]))

  /** What this device inherits for a field; undefined when it has its own value or nothing above it. */
  const inheritedFor = (field: ResponsiveField) => {
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

  const alignKey = fieldKey('textAlign', device)
  const inheritedAlign = values[alignKey] ? undefined : inheritedFor('textAlign')

  const fontSizeKey = fieldKey('fontSize', device)
  const ownFontSize = values[fontSizeKey]
  const inheritedFontSize = inheritedFor('fontSize')

  // Custom is sticky once picked, so typing a value doesn't bounce the field
  // back to the dropdown between keystrokes; a value already on the document
  // that isn't one of the presets (e.g. from before this existed) opens in
  // Custom the same way, with no click needed. Keyed off this device's own
  // value, not the inherited one — a Tablet override only ever writes to
  // fontSizeTablet, never the Desktop base it's shown next to.
  const [forceCustom, setForceCustom] = useState(false)
  const isPreset = FONT_SIZES.some((f) => f.value === ownFontSize)
  const showCustomSize = forceCustom || (!!ownFontSize && !isPreset)

  const pickFontSize = (next: string) => {
    setForceCustom(next === CUSTOM)
    if (next !== CUSTOM) write(fontSizeKey, next)
  }

  // Custom mode is per-device only in effect, not in state: left on, it would
  // show the number box on a device whose own value doesn't need it.
  const changeDevice = (next: Device) => {
    setDevice(next)
    setForceCustom(false)
  }

  const clearAll = () => onChange(ALL_KEYS.map((key) => unset([key])) as FormPatch[])
  const hasValues = ALL_KEYS.some((key) => values[key])

  const responsive = {device, onDevice: changeDevice}
  const maxWidth = MAX_WIDTH[device]

  return (
    <Stack space={4}>
      <ControlRow label="Alignment" responsive={responsive}>
        <IconToggleGroup
          options={ALIGN_OPTIONS}
          value={values[alignKey] || inheritedAlign}
          inherited={Boolean(inheritedAlign)}
          onChange={(next) => write(alignKey, next ?? '')}
        />
      </ControlRow>

      <ControlRow
        label="Size"
        responsive={responsive}
        hint={maxWidth ? `Applies at ${maxWidth} and narrower. Empty inherits.` : undefined}
      >
        <Flex align="center" gap={1}>
          <CompactSelect
            value={showCustomSize ? CUSTOM : (ownFontSize ?? '')}
            placeholder={inheritedFontSize ? `${inheritedFontSize}px` : 'Size'}
            width={showCustomSize ? 90 : 80}
            options={FONT_SIZE_OPTIONS}
            onChange={pickFontSize}
          />
          {showCustomSize && (
            <>
              <Box style={{width: 64}}>
                <TextInput
                  type="number"
                  min={1}
                  fontSize={1}
                  padding={2}
                  autoFocus={forceCustom}
                  value={ownFontSize ?? ''}
                  placeholder={inheritedFontSize ?? 'Size'}
                  onChange={(e) => write(fontSizeKey, e.currentTarget.value)}
                  aria-label="Custom font size in px"
                  style={{textAlign: 'center'}}
                />
              </Box>
              <Text size={0} muted>
                px
              </Text>
            </>
          )}
        </Flex>
      </ControlRow>

      <ControlRow label="Color">
        <Box style={{minWidth: 0}}>
          <ColorInput value={values.textColor} placeholder="#333" onChange={(v) => write('textColor', v)} />
        </Box>
      </ControlRow>

      {/* Headings only (H1–H6 in this block); its paragraphs keep the theme font. */}
      <ControlRow label="Heading font">
        <CompactSelect
          value={values.headingFont}
          placeholder="Theme default"
          width={160}
          options={FONT_OPTIONS}
          onChange={(v) => write('headingFont', v)}
        />
      </ControlRow>

      {hasValues && (
        <Flex justify="flex-end">
          <Button mode="bleed" padding={2} fontSize={1} text="Clear" onClick={clearAll} />
        </Flex>
      )}
    </Stack>
  )
}
