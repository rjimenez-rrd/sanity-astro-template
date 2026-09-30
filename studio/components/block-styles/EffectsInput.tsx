import {type ObjectInputProps, set, unset} from 'sanity'
import {Button, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {ControlRow} from '../controls/controls'
import {CompactSelect} from '../controls/CompactSelect'

const SHADOWS = [
  {title: 'None', value: 'none'},
  {title: 'Small', value: 'sm'},
  {title: 'Medium', value: 'md'},
  {title: 'Large', value: 'lg'},
  {title: 'XL', value: 'xl'},
]

const OVERFLOWS = [
  {title: 'Visible', value: 'visible'},
  {title: 'Hidden', value: 'hidden'},
]

/** Block Styles -> Effects: shadow preset, opacity (0-100%) and overflow. */
export function EffectsInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const values = (value ?? {}) as {shadow?: string; opacity?: number; overflow?: string}

  /** A dropdown: the empty choice clears the field. */
  const setChoice = (field: 'shadow' | 'overflow', next: string) =>
    onChange(next === '' ? unset([field]) : set(next, [field]))

  /** Opacity: a whole number 0-100; empty clears it, anything else is ignored. */
  const setOpacity = (raw: string) => {
    if (raw === '') return onChange(unset(['opacity']))
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && n >= 0 && n <= 100) onChange(set(n, ['opacity']))
  }

  const hasValues = Boolean(values.shadow || values.opacity !== undefined || values.overflow)

  return (
    <Stack space={3}>
      <ControlRow label="Shadow">
        <CompactSelect
          value={values.shadow}
          placeholder="Default"
          width={120}
          options={SHADOWS}
          onChange={(v) => setChoice('shadow', v)}
        />
      </ControlRow>

      <ControlRow label="Opacity">
        <Flex align="center" gap={2}>
          <div style={{width: 72}}>
            <TextInput
              type="number"
              min={0}
              max={100}
              fontSize={1}
              padding={2}
              value={typeof values.opacity === 'number' ? values.opacity : ''}
              placeholder="100"
              onChange={(e) => setOpacity(e.currentTarget.value)}
            />
          </div>
          <Text size={1} muted>
            %
          </Text>
        </Flex>
      </ControlRow>

      <ControlRow label="Overflow">
        <CompactSelect
          value={values.overflow}
          placeholder="Default"
          width={120}
          options={OVERFLOWS}
          onChange={(v) => setChoice('overflow', v)}
        />
      </ControlRow>

      {hasValues && (
        <Flex justify="flex-end">
          <Button
            mode="bleed"
            padding={2}
            fontSize={1}
            text="Clear"
            onClick={() => onChange([unset(['shadow']), unset(['opacity']), unset(['overflow'])])}
          />
        </Flex>
      )}
    </Stack>
  )
}
