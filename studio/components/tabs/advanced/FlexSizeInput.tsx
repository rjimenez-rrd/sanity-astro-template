import {useState} from 'react'
import {set, unset, type ObjectInputProps} from 'sanity'
import {Flex, Stack, Text, TextInput} from '@sanity/ui'
import {CloseCircleIcon, CollapseIcon, EllipsisVerticalIcon, ExpandIcon} from '@sanity/icons'
import {ControlRow, IconToggleGroup, type IconOption} from '../../controls/controls'
import {resolveResponsive, type Device, type Responsive} from '../../controls/responsive'

type Mode = 'none' | 'grow' | 'shrink' | 'custom'
type SizeValue = {mode?: Mode; grow?: number; shrink?: number}

const OPTIONS: IconOption[] = [
  {value: 'none', title: 'None', icon: <CloseCircleIcon />},
  {value: 'grow', title: 'Grow', icon: <ExpandIcon />},
  {value: 'shrink', title: 'Shrink', icon: <CollapseIcon />},
  {value: 'custom', title: 'Custom', icon: <EllipsisVerticalIcon />},
]

/**
 * Elementor's Size: how this item takes up its parent's spare room. None keeps
 * its own size, Grow fills what's left, Shrink gives way when space runs out,
 * Custom sets the grow and shrink numbers. Per device, like Order.
 */
export function FlexSizeInput(props: ObjectInputProps) {
  const {onChange} = props
  const value = (props.value ?? {}) as Responsive<SizeValue>
  const [device, setDevice] = useState<Device>('desktop')
  const {value: current, inherited} = resolveResponsive(value, device)
  const own = value[device]

  const number = (key: 'grow' | 'shrink', raw: string) => {
    if (raw.trim() === '') return onChange(unset([device, key]))
    const n = Number(raw)
    if (Number.isFinite(n) && n >= 0) onChange(set(Math.min(n, 99), [device, key]))
  }

  return (
    <Stack space={3}>
      <ControlRow label="Size" responsive={{device, onDevice: setDevice}}>
        <IconToggleGroup
          options={OPTIONS}
          value={current?.mode}
          inherited={inherited}
          onChange={(next) =>
            onChange(next === undefined ? unset([device]) : set({...own, mode: next as Mode}, [device]))
          }
        />
      </ControlRow>
      {current?.mode === 'custom' && (
        <Flex gap={3}>
          {(['grow', 'shrink'] as const).map((key) => (
            <Stack key={key} space={2} flex={1}>
              <Text size={0} muted>
                {key === 'grow' ? 'Flex Grow' : 'Flex Shrink'}
              </Text>
              <TextInput
                fontSize={1}
                type="number"
                min={0}
                value={own?.[key] ?? ''}
                placeholder={String(current?.[key] ?? (key === 'grow' ? 0 : 1))}
                onChange={(e) => number(key, e.currentTarget.value)}
              />
            </Stack>
          ))}
        </Flex>
      )}
    </Stack>
  )
}
