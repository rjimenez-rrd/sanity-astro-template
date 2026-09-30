import {useState} from 'react'
import {set, unset, type ObjectInputProps} from 'sanity'
import {ControlRow, IconToggleGroup, type IconOption} from '../container/controls'
import {AlignCenterIcon, AlignEndIcon, AlignStartIcon, AlignStretchIcon} from '../container/icons'
import {resolveResponsive, type Device, type Responsive} from '../container/responsive'

const OPTIONS: IconOption[] = [
  {value: 'flex-start', title: 'Start', icon: <AlignStartIcon />},
  {value: 'center', title: 'Center', icon: <AlignCenterIcon />},
  {value: 'flex-end', title: 'End', icon: <AlignEndIcon />},
  {value: 'stretch', title: 'Stretch', icon: <AlignStretchIcon />},
]

/**
 * Elementor's Align Self: where this item sits across its parent's direction,
 * overriding the parent's Align Items for this one item. Per device; a device
 * left empty follows the one above it, which the buttons show dimmed.
 */
export function AlignSelfInput(props: ObjectInputProps) {
  const {onChange} = props
  const value = (props.value ?? {}) as Responsive<string>
  const [device, setDevice] = useState<Device>('desktop')
  const {value: current, inherited} = resolveResponsive(value, device)

  return (
    <ControlRow
      label="Align Self"
      responsive={{device, onDevice: setDevice}}
      hint="This control will affect contained elements only."
    >
      <IconToggleGroup
        options={OPTIONS}
        value={current}
        inherited={inherited}
        onChange={(next) => onChange(next === undefined ? unset([device]) : set(next, [device]))}
      />
    </ControlRow>
  )
}
