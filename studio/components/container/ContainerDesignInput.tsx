import {useCallback, useState, type ReactNode} from 'react'
import {FormInput, type FormPatch, type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {Box, Button, Card, Select, Stack, Text} from '@sanity/ui'
import {EditIcon} from '@sanity/icons'
import {ColorPicker} from '../color/ColorPicker'
import {
  ControlRow,
  DimensionsInput,
  IconToggleGroup,
  SectionHeader,
  SliderInput,
  StateTabs,
  UnitSelect,
  type Sides,
} from './controls'
import {BrushIcon, GradientIcon} from './icons'
import {resolveResponsive, type Device, type Responsive} from './responsive'

type State = 'normal' | 'hover'
type Path = (string | number)[]

type BackgroundState = {
  type?: 'classic' | 'gradient'
  color?: string
  image?: {asset?: unknown}
  imageTablet?: {asset?: unknown}
  imageMobile?: {asset?: unknown}
  imageResolution?: string
  position?: Responsive<string>
  attachment?: string
  repeat?: Responsive<string>
  size?: Responsive<string>
  gradient?: {
    color?: string
    location?: Responsive<number>
    secondColor?: string
    secondLocation?: Responsive<number>
    gradientType?: string
    angle?: Responsive<number>
    position?: string
  }
  opacity?: Responsive<number>
  filters?: {blur?: number; brightness?: number; contrast?: number; saturate?: number; hue?: number}
  blendMode?: string
  transition?: number
}

type SidesValue = Responsive<Sides & {unit?: string}> & {linked?: boolean}

type BorderState = {
  type?: string
  width?: SidesValue
  color?: string
  radius?: SidesValue
  shadow?: {
    color?: string
    horizontal?: number
    vertical?: number
    blur?: number
    spread?: number
    position?: string
  }
  transition?: number
}

type DesignValue = {
  background?: Partial<Record<State, BackgroundState>>
  overlay?: Partial<Record<State, BackgroundState>>
  border?: Partial<Record<State, BorderState>>
}

const STATES: {value: State; title: string}[] = [
  {value: 'normal', title: 'Normal'},
  {value: 'hover', title: 'Hover'},
]

const TYPES = [
  {value: 'classic', title: 'Classic', icon: <BrushIcon />},
  {value: 'gradient', title: 'Gradient', icon: <GradientIcon />},
]

const POSITIONS: [string, string][] = [
  ['center center', 'Center Center'],
  ['center left', 'Center Left'],
  ['center right', 'Center Right'],
  ['top center', 'Top Center'],
  ['top left', 'Top Left'],
  ['top right', 'Top Right'],
  ['bottom center', 'Bottom Center'],
  ['bottom left', 'Bottom Left'],
  ['bottom right', 'Bottom Right'],
]
const REPEATS: [string, string][] = [
  ['no-repeat', 'No-repeat'],
  ['repeat', 'Repeat'],
  ['repeat-x', 'Repeat-x'],
  ['repeat-y', 'Repeat-y'],
]
const SIZES: [string, string][] = [
  ['auto', 'Auto'],
  ['cover', 'Cover'],
  ['contain', 'Contain'],
]
const RESOLUTIONS: [string, string][] = [
  ['full', 'Full'],
  ['large', 'Large - 1024'],
  ['medium_large', 'Medium Large - 768'],
  ['medium', 'Medium - 300'],
  ['thumbnail', 'Thumbnail - 150'],
]
const BLEND_MODES: [string, string][] = [
  ['multiply', 'Multiply'],
  ['screen', 'Screen'],
  ['overlay', 'Overlay'],
  ['darken', 'Darken'],
  ['lighten', 'Lighten'],
  ['color-dodge', 'Color Dodge'],
  ['saturation', 'Saturation'],
  ['color', 'Color'],
  ['difference', 'Difference'],
  ['exclusion', 'Exclusion'],
  ['hue', 'Hue'],
  ['luminosity', 'Luminosity'],
]

const FILTERS = [
  {key: 'blur', label: 'Blur', unit: 'px', max: 10, step: 0.1, placeholder: 0},
  {key: 'brightness', label: 'Brightness', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'contrast', label: 'Contrast', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'saturate', label: 'Saturation', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'hue', label: 'Hue', unit: 'deg', max: 360, step: 1, placeholder: 0},
] as const

const BORDER_TYPES: [string, string][] = [
  ['none', 'None'],
  ['solid', 'Solid'],
  ['double', 'Double'],
  ['dotted', 'Dotted'],
  ['dashed', 'Dashed'],
  ['groove', 'Groove'],
]

/** Native-feeling dropdown with a "Default" first option meaning "not set". */
function Dropdown({
  value,
  options,
  placeholder = 'Default',
  onChange,
}: {
  value: string | undefined
  options: [string, string][]
  placeholder?: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <Box style={{minWidth: 150}}>
      <Select
        fontSize={1}
        padding={2}
        value={value ?? ''}
        onChange={(e) => onChange(e.currentTarget.value || undefined)}
      >
        <option value="">{placeholder}</option>
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </Select>
    </Box>
  )
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <Card borderBottom>
      <SectionHeader title={title} open={open} onToggle={onToggle} />
      {open && (
        <Box paddingX={3} paddingBottom={4} paddingTop={1}>
          <Stack space={4}>{children}</Stack>
        </Box>
      )}
    </Card>
  )
}

/** Which background-image field holds each device's image. */
const IMAGE_FIELD = {desktop: 'image', tablet: 'imageTablet', mobile: 'imageMobile'} as const

const Divider = () => <Box style={{borderTop: '1px solid var(--card-border-color)'}} />

export function ContainerDesignInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const v = (value ?? {}) as DesignValue

  const [device, setDevice] = useState<Device>('desktop')
  const responsive = {device, onDevice: setDevice}
  const [open, setOpen] = useState({background: true, overlay: false, border: false})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [states, setStates] = useState<Record<keyof DesignValue, State>>({
    background: 'normal',
    overlay: 'normal',
    border: 'normal',
  })

  /** Writes one leaf, creating missing parent objects on the way. */
  const patch = useCallback(
    (path: Path, next: unknown) => {
      const ops: FormPatch[] = [setIfMissing({})]
      for (let i = 1; i < path.length; i++) ops.push(setIfMissing({}, path.slice(0, i)))
      ops.push(next === undefined || next === '' ? unset(path) : set(next, path))
      onChange(ops)
    },
    [onChange],
  )

  const toggle = (key: keyof typeof open) => setOpen((o) => ({...o, [key]: !o[key]}))

  /** Dropdown bound to one device of a responsive string. */
  const responsiveDropdown = (
    label: string,
    path: Path,
    current: Responsive<string> | undefined,
    options: [string, string][],
  ) => {
    const resolved = resolveResponsive(current, device)
    const inheritedLabel =
      resolved.inherited && resolved.value
        ? `Default (${options.find(([v]) => v === resolved.value)?.[1] ?? resolved.value})`
        : 'Default'
    return (
      <ControlRow label={label} responsive={responsive}>
        <Dropdown
          value={current?.[device]}
          options={options}
          placeholder={inheritedLabel}
          onChange={(next) => patch([...path, device], next)}
        />
      </ControlRow>
    )
  }

  /** Slider bound to one device of a responsive number; empty inherits. */
  const responsiveSlider = (
    label: string,
    path: Path,
    current: Responsive<number> | undefined,
    opts: {unit?: string; min?: number; max: number; step?: number; fallback?: number},
  ) => {
    const resolved = resolveResponsive(current, device)
    return (
      <ControlRow
        label={label}
        responsive={responsive}
        stacked
        aside={opts.unit ? <UnitSelect unit={opts.unit} units={[opts.unit]} onChange={() => {}} /> : undefined}
      >
        <SliderInput
          size={current?.[device]}
          placeholder={resolved.inherited ? resolved.value : opts.fallback}
          min={opts.min}
          max={opts.max}
          step={opts.step}
          onChange={(n) => patch([...path, device], n)}
        />
      </ControlRow>
    )
  }

  const backgroundControls = (
    section: 'background' | 'overlay',
    extra: {opacity?: boolean},
  ) => {
    const state = states[section]
    const base: Path = [section, state]
    const bg = v[section]?.[state] ?? {}
    const type = bg.type
    const g = bg.gradient ?? {}

    return (
      <>
        <StateTabs
          value={state}
          options={STATES}
          onChange={(s) => setStates((prev) => ({...prev, [section]: s}))}
        />

        <ControlRow label={section === 'overlay' ? 'Overlay Type' : 'Background Type'}>
          <IconToggleGroup
            options={TYPES}
            value={type}
            onChange={(next) => patch([...base, 'type'], next)}
          />
        </ControlRow>

        {type === 'classic' && (
          <>
            <ControlRow label="Color">
              <ColorPicker value={bg.color} onChange={(c) => patch([...base, 'color'], c)} />
            </ControlRow>

            <ControlRow
              label="Image"
              responsive={responsive}
              stacked
              hint={
                device !== 'desktop' && !bg[IMAGE_FIELD[device]]?.asset
                  ? `Empty: uses the ${device === 'mobile' && bg.imageTablet?.asset ? 'Tablet' : 'Desktop'} image. Add one to replace it on ${device}.`
                  : undefined
              }
            >
              {/* One uploader per device; key forces a fresh input when the device changes. */}
              <FormInput key={device} {...props} relativePath={[...base, IMAGE_FIELD[device]]} />
            </ControlRow>

            {Boolean(bg.image?.asset || bg.imageTablet?.asset || bg.imageMobile?.asset) && (
              <>
                <ControlRow
                  label="Image Resolution"
                  hint="Full uses the original, up to 2560px wide."
                >
                  <Dropdown
                    value={bg.imageResolution}
                    options={RESOLUTIONS}
                    placeholder="Full"
                    onChange={(next) => patch([...base, 'imageResolution'], next)}
                  />
                </ControlRow>
                <Divider />
                {responsiveDropdown('Position', [...base, 'position'], bg.position, POSITIONS)}
                <ControlRow label="Attachment">
                  <Dropdown
                    value={bg.attachment}
                    options={[
                      ['scroll', 'Scroll'],
                      ['fixed', 'Fixed'],
                    ]}
                    onChange={(next) => patch([...base, 'attachment'], next)}
                  />
                </ControlRow>
                {responsiveDropdown('Repeat', [...base, 'repeat'], bg.repeat, REPEATS)}
                {responsiveDropdown('Display Size', [...base, 'size'], bg.size, SIZES)}
              </>
            )}
          </>
        )}

        {type === 'gradient' && (
          <>
            <Card
              padding={3}
              radius={2}
              tone="caution"
              style={{borderLeft: '3px solid var(--card-badge-caution-dot-color, orange)'}}
            >
              <Text size={1} style={{fontStyle: 'italic', lineHeight: 1.5}}>
                Set locations and angle for each breakpoint to ensure the gradient adapts to
                different screen sizes.
              </Text>
            </Card>
            <ControlRow label="Color">
              <ColorPicker value={g.color} onChange={(c) => patch([...base, 'gradient', 'color'], c)} />
            </ControlRow>
            {responsiveSlider('Location', [...base, 'gradient', 'location'], g.location, {
              unit: '%',
              max: 100,
              fallback: 0,
            })}
            <ControlRow label="Second Color">
              <ColorPicker
                value={g.secondColor}
                onChange={(c) => patch([...base, 'gradient', 'secondColor'], c)}
              />
            </ControlRow>
            {responsiveSlider('Location', [...base, 'gradient', 'secondLocation'], g.secondLocation, {
              unit: '%',
              max: 100,
              fallback: 100,
            })}
            <ControlRow label="Type">
              <Dropdown
                value={g.gradientType}
                options={[
                  ['linear', 'Linear'],
                  ['radial', 'Radial'],
                ]}
                placeholder="Linear"
                onChange={(next) => patch([...base, 'gradient', 'gradientType'], next)}
              />
            </ControlRow>
            {g.gradientType === 'radial' ? (
              <ControlRow label="Position">
                <Dropdown
                  value={g.position}
                  options={POSITIONS}
                  placeholder="Center Center"
                  onChange={(next) => patch([...base, 'gradient', 'position'], next)}
                />
              </ControlRow>
            ) : (
              responsiveSlider('Angle', [...base, 'gradient', 'angle'], g.angle, {
                unit: 'deg',
                max: 360,
                fallback: 180,
              })
            )}
          </>
        )}

        {extra.opacity && type && (
          <>
            {responsiveSlider('Opacity', [...base, 'opacity'], bg.opacity, {
              max: 1,
              step: 0.01,
              fallback: 0.5,
            })}

            <ControlRow label="CSS Filters">
              <Button
                mode={filtersOpen ? 'default' : 'ghost'}
                tone={filtersOpen ? 'primary' : 'default'}
                icon={EditIcon}
                padding={2}
                aria-label="Edit CSS filters"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((o) => !o)}
              />
            </ControlRow>
            {filtersOpen && (
              <Card padding={3} radius={2} border>
                <Stack space={4}>
                  {FILTERS.map((f) => (
                    <ControlRow
                      key={f.key}
                      label={f.label}
                      stacked
                      aside={<UnitSelect unit={f.unit} units={[f.unit]} onChange={() => {}} />}
                    >
                      <SliderInput
                        size={bg.filters?.[f.key]}
                        placeholder={f.placeholder}
                        max={f.max}
                        step={f.step}
                        onChange={(n) => patch([...base, 'filters', f.key], n)}
                      />
                    </ControlRow>
                  ))}
                </Stack>
              </Card>
            )}

            <ControlRow label="Blend Mode">
              <Dropdown
                value={bg.blendMode}
                options={BLEND_MODES}
                placeholder="Normal"
                onChange={(next) => patch([...base, 'blendMode'], next)}
              />
            </ControlRow>
          </>
        )}

        {state === 'hover' && (
          <ControlRow label="Transition Duration" stacked aside={<UnitSelect unit="s" units={['s']} onChange={() => {}} />}>
            <SliderInput
              size={bg.transition}
              placeholder={0.3}
              max={3}
              step={0.1}
              onChange={(n) => patch([...base, 'transition'], n)}
            />
          </ControlRow>
        )}
      </>
    )
  }

  const sidesControl = (
    label: string,
    path: Path,
    current: SidesValue | undefined,
    labels?: [string, string, string, string],
  ) => {
    const own = current?.[device]
    const resolved = resolveResponsive(current as Responsive<Sides & {unit?: string}>, device)
    const unit = own?.unit ?? resolved.value?.unit ?? 'px'
    return (
      <ControlRow
        label={label}
        responsive={responsive}
        stacked
        aside={
          <UnitSelect
            unit={unit}
            units={['px', '%', 'em', 'rem']}
            onChange={(u) => patch([...path, device, 'unit'], u)}
          />
        }
      >
        <DimensionsInput
          value={own}
          placeholder={resolved.inherited ? resolved.value : undefined}
          linked={current?.linked ?? true}
          labels={labels}
          onLinkedChange={(linked) => patch([...path, 'linked'], linked)}
          onChange={(next) => {
            const empty = Object.values(next).every((n) => n === undefined)
            patch([...path, device], empty ? undefined : {...next, unit})
          }}
        />
      </ControlRow>
    )
  }

  const borderControls = () => {
    const state = states.border
    const base: Path = ['border', state]
    const b = v.border?.[state] ?? {}
    const sh = b.shadow ?? {}
    const hasBorder = Boolean(b.type && b.type !== 'none')

    return (
      <>
        <StateTabs
          value={state}
          options={STATES}
          onChange={(s) => setStates((prev) => ({...prev, border: s}))}
        />

        <ControlRow label="Border Type">
          <Dropdown
            value={b.type}
            options={BORDER_TYPES}
            onChange={(next) => patch([...base, 'type'], next)}
          />
        </ControlRow>

        {hasBorder && (
          <>
            {sidesControl('Width', [...base, 'width'], b.width)}
            <ControlRow label="Color">
              <ColorPicker value={b.color} onChange={(c) => patch([...base, 'color'], c)} />
            </ControlRow>
          </>
        )}

        {sidesControl('Border Radius', [...base, 'radius'], b.radius, [
          'Top Left',
          'Top Right',
          'Bottom Right',
          'Bottom Left',
        ])}

        <Divider />

        <ControlRow label="Box Shadow Color">
          <ColorPicker value={sh.color} onChange={(c) => patch([...base, 'shadow', 'color'], c)} />
        </ControlRow>
        {sh.color && (
          <>
            {(
              [
                ['horizontal', 'Horizontal', -100, 100, 0],
                ['vertical', 'Vertical', -100, 100, 0],
                ['blur', 'Blur', 0, 100, 10],
                ['spread', 'Spread', -100, 100, 0],
              ] as const
            ).map(([key, label, min, max, placeholder]) => (
              <ControlRow key={key} label={label} stacked>
                <SliderInput
                  size={sh[key]}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  onChange={(n) => patch([...base, 'shadow', key], n)}
                />
              </ControlRow>
            ))}
            <ControlRow label="Position">
              <Dropdown
                value={sh.position}
                options={[
                  ['outline', 'Outline'],
                  ['inset', 'Inset'],
                ]}
                placeholder="Outline"
                onChange={(next) => patch([...base, 'shadow', 'position'], next)}
              />
            </ControlRow>
          </>
        )}

        {state === 'hover' && (
          <ControlRow label="Transition Duration" stacked aside={<UnitSelect unit="s" units={['s']} onChange={() => {}} />}>
            <SliderInput
              size={b.transition}
              placeholder={0.3}
              max={3}
              step={0.1}
              onChange={(n) => patch([...base, 'transition'], n)}
            />
          </ControlRow>
        )}
      </>
    )
  }

  return (
    <Card border radius={2} overflow="hidden">
      <Section title="Background" open={open.background} onToggle={() => toggle('background')}>
        {backgroundControls('background', {})}
      </Section>
      <Section title="Background Overlay" open={open.overlay} onToggle={() => toggle('overlay')}>
        {backgroundControls('overlay', {opacity: true})}
      </Section>
      <Section title="Border" open={open.border} onToggle={() => toggle('border')}>
        {borderControls()}
      </Section>
    </Card>
  )
}
