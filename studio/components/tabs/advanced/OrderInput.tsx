import {useCallback, useState} from 'react'
import {set, unset, type ObjectInputProps} from 'sanity'
import {Stack, TextInput} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {ControlRow, IconToggleGroup, type IconOption} from '../../controls/controls'
import {OrderEndIcon, OrderStartIcon} from '../../controls/icons'
import {resolveResponsive, type Device, type Responsive} from '../../controls/responsive'

/** The values Start and End stand for; the renderer clamps order to ±99. */
const START = -99
const END = 99

type Mode = 'start' | 'end' | 'custom'

const OPTIONS: IconOption[] = [
  {value: 'start', title: 'Start', icon: <OrderStartIcon />},
  {value: 'end', title: 'End', icon: <OrderEndIcon />},
  {value: 'custom', title: 'Custom', icon: <EllipsisVerticalIcon />},
]

const modeOf = (n: number | undefined): Mode | undefined =>
  n === undefined ? undefined : n === START ? 'start' : n === END ? 'end' : 'custom'

/**
 * Elementor's Order control: Start / End / Custom per device, where Custom
 * reveals a number. Stored as {desktop, tablet, mobile}; a device left empty
 * follows the one above it, which the buttons show dimmed.
 */
export function OrderInput(props: ObjectInputProps) {
  const {onChange} = props
  const value = (props.value ?? {}) as Responsive<number>
  const [device, setDevice] = useState<Device>('desktop')
  // Custom with no number yet still needs its field shown, so the choice is
  // remembered here until a number is typed.
  const [pendingCustom, setPendingCustom] = useState<Device | null>(null)

  const {value: current, inherited} = resolveResponsive(value, device)
  const own = value[device]
  const mode = pendingCustom === device ? 'custom' : modeOf(current)

  const choose = useCallback(
    (next: string | undefined) => {
      setPendingCustom(null)
      if (next === undefined) onChange(unset([device]))
      else if (next === 'start') onChange(set(START, [device]))
      else if (next === 'end') onChange(set(END, [device]))
      // Custom keeps a number already set here; otherwise it waits for one.
      else if (modeOf(own) !== 'custom') setPendingCustom(device)
    },
    [device, onChange, own],
  )

  const typeNumber = useCallback(
    (raw: string) => {
      if (raw.trim() === '') {
        onChange(unset([device]))
        return
      }
      const n = Math.round(Number(raw))
      if (!Number.isFinite(n)) return
      setPendingCustom(null)
      onChange(set(Math.max(START + 1, Math.min(END - 1, n)), [device]))
    },
    [device, onChange],
  )

  return (
    <Stack space={3}>
      <ControlRow
        label="Order"
        responsive={{device, onDevice: (d) => setDevice(d)}}
        hint="This control will affect contained elements only."
      >
        <IconToggleGroup
          options={OPTIONS}
          value={mode}
          inherited={inherited && pendingCustom !== device}
          onChange={choose}
        />
      </ControlRow>

      {mode === 'custom' && (
        <TextInput
          type="number"
          fontSize={1}
          padding={2}
          placeholder={inherited && current !== undefined ? String(current) : 'e.g. 1'}
          value={own !== undefined && modeOf(own) === 'custom' ? String(own) : ''}
          onChange={(e) => typeNumber(e.currentTarget.value)}
          aria-label="Custom order"
        />
      )}
    </Stack>
  )
}
