import {type ReactNode} from 'react'
import {type ObjectInputProps} from 'sanity'
import {Box, Card, Select, Stack} from '@sanity/ui'
import {SectionHeader, type Sides} from '../../controls/controls'
import {type Device, type Responsive} from '../../controls/responsive'
import {type Option} from './options'

/**
 * Shared pieces of the Style panel's sections: the saved value's shape, the
 * context each section gets from StyleInput, and small layout helpers.
 */

export type State = 'normal' | 'hover'
export type Path = (string | number)[]

export const STATES: {value: State; title: string}[] = [
  {value: 'normal', title: 'Normal'},
  {value: 'hover', title: 'Hover'},
]

export type BackgroundState = {
  type?: 'classic' | 'gradient' | 'video' | 'slideshow'
  video?: {url?: string; start?: number; end?: number; playOnce?: boolean; playOnMobile?: boolean}
  slideshow?: {
    loop?: boolean
    duration?: number
    transition?: string
    transitionDuration?: number
    size?: string
    position?: string
    kenBurns?: boolean
    kenBurnsDirection?: string
  }
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

export type SidesValue = Responsive<Sides & {unit?: string}> & {linked?: boolean}

export type BorderState = {
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

export type ShapeState = {
  type?: string
  color?: string
  width?: Responsive<number>
  height?: Responsive<number>
  flip?: boolean
  invert?: boolean
  front?: boolean
}

export type DesignValue = {
  background?: Partial<Record<State, BackgroundState>>
  overlay?: Partial<Record<State, BackgroundState>>
  border?: Partial<Record<State, BorderState>>
  shapeDivider?: {top?: ShapeState; bottom?: ShapeState}
}

/** What every section needs from the panel: the writer and the shared device. */
export type StyleCtx = {
  /** Writes one leaf, creating missing parent objects on the way. */
  patch: (path: Path, next: unknown) => void
  device: Device
  responsive: {device: Device; onDevice: (d: Device) => void}
  /** The panel's own props, for embedding the uploaders with FormInput. */
  inputProps: ObjectInputProps
}

/** Native-feeling dropdown with a "Default" first option meaning "not set". */
export function Dropdown({
  value,
  options,
  placeholder = 'Default',
  onChange,
}: {
  value: string | undefined
  options: Option[]
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

/** A collapsible panel section; its controls unmount while closed. */
export function Section({
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

export const Divider = () => <Box style={{borderTop: '1px solid var(--card-border-color)'}} />
