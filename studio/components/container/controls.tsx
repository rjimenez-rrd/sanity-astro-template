import {useId, type ReactNode} from 'react'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text, TextInput, Tooltip} from '@sanity/ui'
import {DesktopIcon, LinkIcon, MobileDeviceIcon, TabletDeviceIcon, UnlinkIcon} from '@sanity/icons'
import {DEVICES, DEVICE_LABELS, type Device} from './responsive'

const DEVICE_ICONS: Record<Device, typeof DesktopIcon> = {
  desktop: DesktopIcon,
  tablet: TabletDeviceIcon,
  mobile: MobileDeviceIcon,
}

/** The monitor icon next to a label; picks which device the panel is editing. */
export function DeviceSwitcher({
  device,
  onChange,
}: {
  device: Device
  onChange: (device: Device) => void
}) {
  const id = useId()
  const Icon = DEVICE_ICONS[device]
  return (
    <MenuButton
      id={id}
      button={
        <Button
          mode="bleed"
          padding={1}
          fontSize={1}
          icon={Icon}
          aria-label={`Editing ${DEVICE_LABELS[device]}. Change device`}
        />
      }
      menu={
        <Menu>
          {DEVICES.map((d) => (
            <MenuItem
              key={d}
              icon={DEVICE_ICONS[d]}
              text={DEVICE_LABELS[d]}
              pressed={d === device}
              onClick={() => onChange(d)}
            />
          ))}
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-start'}}
    />
  )
}

type Responsiveness = {device: Device; onDevice: (d: Device) => void} | undefined

function Label({label, responsive}: {label: string; responsive?: Responsiveness}) {
  return (
    <Flex align="center" gap={1} style={{minHeight: 25}}>
      <Text size={1} weight="medium">
        {label}
      </Text>
      {responsive && <DeviceSwitcher device={responsive.device} onChange={responsive.onDevice} />}
    </Flex>
  )
}

/**
 * One control line. Inline puts the control to the right of the label, as
 * Elementor does for dropdowns and short button groups; stacked puts it
 * underneath, for sliders and wide button groups.
 */
export function ControlRow({
  label,
  responsive,
  aside,
  hint,
  stacked,
  children,
}: {
  label: string
  responsive?: Responsiveness
  aside?: ReactNode
  hint?: string
  stacked?: boolean
  children: ReactNode
}) {
  return (
    <Stack space={2}>
      {stacked ? (
        <>
          <Flex align="center" justify="space-between">
            <Label label={label} responsive={responsive} />
            {aside}
          </Flex>
          {children}
        </>
      ) : (
        <Flex align="center" justify="space-between" gap={3}>
          <Label label={label} responsive={responsive} />
          <Box style={{flexShrink: 0}}>{children}</Box>
        </Flex>
      )}
      {hint && (
        <Text size={1} muted style={{fontStyle: 'italic', lineHeight: 1.4}}>
          {hint}
        </Text>
      )}
    </Stack>
  )
}

export type IconOption = {value: string; title: string; icon: ReactNode}

/**
 * Segmented icon buttons. Clicking the explicitly set option clears it, which
 * lets a tablet/mobile value fall back to inheriting again.
 */
export function IconToggleGroup({
  options,
  value,
  inherited,
  onChange,
  fill,
}: {
  options: IconOption[]
  value: string | undefined
  inherited?: boolean
  onChange: (value: string | undefined) => void
  fill?: boolean
}) {
  return (
    <Card border radius={2} overflow="hidden" style={{display: fill ? 'block' : 'inline-block'}}>
      <Flex>
        {options.map((opt, i) => {
          const selected = value === opt.value
          return (
            <Tooltip
              key={opt.value}
              content={
                <Box padding={2}>
                  <Text size={1}>
                    {opt.title}
                    {selected && inherited ? ' (inherited)' : ''}
                  </Text>
                </Box>
              }
              placement="top"
              portal
            >
              <Button
                mode={selected ? 'default' : 'bleed'}
                tone={selected && !inherited ? 'primary' : 'default'}
                radius={0}
                padding={2}
                aria-label={opt.title}
                aria-pressed={selected}
                onClick={() => onChange(selected && !inherited ? undefined : opt.value)}
                style={{
                  flex: fill ? 1 : undefined,
                  opacity: selected && inherited ? 0.65 : 1,
                  borderLeft: i > 0 ? '1px solid var(--card-border-color)' : undefined,
                }}
              >
                <Flex justify="center" style={{fontSize: 17}}>
                  {opt.icon}
                </Flex>
              </Button>
            </Tooltip>
          )
        })}
      </Flex>
    </Card>
  )
}

/** Compact dropdown styled after Elementor's "px ▾" unit picker. */
export function UnitSelect({
  unit,
  units,
  onChange,
}: {
  unit: string
  units: readonly string[]
  onChange: (unit: string) => void
}) {
  return (
    <select
      value={unit}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Unit"
      style={{
        border: 'none',
        background: 'transparent',
        color: 'var(--card-muted-fg-color)',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
        padding: '2px 0',
      }}
    >
      {units.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  )
}

function parseNumber(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Slider plus number box. An empty box means "inherit"; the placeholder shows what. */
export function SliderInput({
  size,
  placeholder,
  min = 0,
  max,
  step = 1,
  onChange,
}: {
  size: number | undefined
  placeholder?: number
  min?: number
  max: number
  step?: number
  onChange: (size: number | undefined) => void
}) {
  const shown = size ?? placeholder ?? min
  return (
    <Flex align="center" gap={3}>
      <input
        type="range"
        min={min}
        max={Math.max(max, shown)}
        step={step}
        value={shown}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{flex: 1, accentColor: 'var(--card-focus-ring-color)', cursor: 'pointer'}}
        aria-label="Value"
      />
      <Box style={{width: 72}}>
        <TextInput
          type="number"
          fontSize={1}
          padding={2}
          value={size ?? ''}
          placeholder={placeholder !== undefined ? String(placeholder) : ''}
          onChange={(e) => onChange(parseNumber(e.currentTarget.value))}
        />
      </Box>
    </Flex>
  )
}

/** Column / Row gap boxes with a link toggle that keeps them equal. */
export function GapsInput({
  column,
  row,
  placeholder,
  linked,
  onChange,
  onLinkedChange,
}: {
  column: number | undefined
  row: number | undefined
  placeholder?: {column?: number; row?: number}
  linked: boolean
  onChange: (next: {column?: number; row?: number}) => void
  onLinkedChange: (linked: boolean) => void
}) {
  const cell = (key: 'column' | 'row', label: string, value: number | undefined) => (
    <Stack space={2} flex={1}>
      <TextInput
        type="number"
        fontSize={1}
        padding={2}
        value={value ?? ''}
        placeholder={placeholder?.[key] !== undefined ? String(placeholder[key]) : ''}
        style={{textAlign: 'center'}}
        onChange={(e) => {
          const n = parseNumber(e.currentTarget.value)
          onChange(linked ? {column: n, row: n} : key === 'column' ? {column: n, row} : {column, row: n})
        }}
      />
      <Text size={0} muted align="center">
        {label}
      </Text>
    </Stack>
  )

  return (
    <Flex gap={1} align="flex-start">
      {cell('column', 'Column', column)}
      {cell('row', 'Row', row)}
      <Button
        mode={linked ? 'default' : 'ghost'}
        tone={linked ? 'primary' : 'default'}
        icon={linked ? LinkIcon : UnlinkIcon}
        padding={2}
        aria-label={linked ? 'Unlink values' : 'Link values'}
        aria-pressed={linked}
        onClick={() => onLinkedChange(!linked)}
      />
    </Flex>
  )
}

/** Collapsible section header, like Elementor's "▾ Container". */
export function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <Button
      mode="bleed"
      padding={2}
      justify="flex-start"
      onClick={onToggle}
      aria-expanded={open}
      style={{width: '100%'}}
    >
      <Flex align="center" gap={2}>
        <Text size={1} style={{display: 'inline-block', transform: open ? 'none' : 'rotate(-90deg)'}}>
          ▾
        </Text>
        <Text size={1} weight="semibold">
          {title}
        </Text>
      </Flex>
    </Button>
  )
}

/** Normal / Hover switch, like Elementor's state tabs. */
export function StateTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: {value: T; title: string}[]
  onChange: (value: T) => void
}) {
  return (
    <Card border radius={2} overflow="hidden">
      <Flex>
        {options.map((opt, i) => {
          const selected = opt.value === value
          return (
            <Button
              key={opt.value}
              mode={selected ? 'default' : 'bleed'}
              tone={selected ? 'primary' : 'default'}
              radius={0}
              padding={2}
              fontSize={1}
              text={opt.title}
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              style={{
                flex: 1,
                borderLeft: i > 0 ? '1px solid var(--card-border-color)' : undefined,
              }}
            />
          )
        })}
      </Flex>
    </Card>
  )
}

export type Sides = {top?: number; right?: number; bottom?: number; left?: number}

/**
 * Four linked number boxes (Top / Right / Bottom / Left), as used by
 * Elementor for border width and radius. Linked edits set all four.
 */
export function DimensionsInput({
  value,
  placeholder,
  linked,
  labels = ['Top', 'Right', 'Bottom', 'Left'],
  onChange,
  onLinkedChange,
}: {
  value: Sides | undefined
  placeholder?: Sides
  linked: boolean
  labels?: [string, string, string, string]
  onChange: (next: Sides) => void
  onLinkedChange: (linked: boolean) => void
}) {
  const keys = ['top', 'right', 'bottom', 'left'] as const
  return (
    <Flex gap={1} align="flex-start">
      {keys.map((key, i) => (
        <Stack key={key} space={2} flex={1}>
          <TextInput
            type="number"
            fontSize={1}
            padding={2}
            value={value?.[key] ?? ''}
            placeholder={placeholder?.[key] !== undefined ? String(placeholder[key]) : ''}
            style={{textAlign: 'center'}}
            onChange={(e) => {
              const n = parseNumber(e.currentTarget.value)
              onChange(
                linked
                  ? {top: n, right: n, bottom: n, left: n}
                  : {...(value ?? {}), [key]: n},
              )
            }}
          />
          <Text size={0} muted align="center">
            {labels[i]}
          </Text>
        </Stack>
      ))}
      <Button
        mode={linked ? 'default' : 'ghost'}
        tone={linked ? 'primary' : 'default'}
        icon={linked ? LinkIcon : UnlinkIcon}
        padding={2}
        aria-label={linked ? 'Unlink values' : 'Link values'}
        aria-pressed={linked}
        onClick={() => onLinkedChange(!linked)}
      />
    </Flex>
  )
}
