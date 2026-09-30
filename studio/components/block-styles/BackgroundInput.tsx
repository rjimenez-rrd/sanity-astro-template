import {type ObjectInputProps, set, unset} from 'sanity'
import {Button, Stack} from '@sanity/ui'
import {ControlRow} from '../controls/controls'
import {ColorInput} from '../controls/ColorInput'

/**
 * Block Styles -> Background: the color with the shared color picker; the
 * image and its options below it keep Sanity's default rendering.
 */
export function BackgroundInput(props: ObjectInputProps) {
  const {renderDefault, onChange, value} = props
  const color = (value as {color?: string} | undefined)?.color

  return (
    <Stack space={3}>
      <ControlRow
        label="Color"
        stacked
        aside={
          color && (
            <Button mode="bleed" padding={2} fontSize={1} text="Clear" onClick={() => onChange(unset(['color']))} />
          )
        }
      >
        <ColorInput
          value={color}
          placeholder="#f5f5f5"
          onChange={(next) => onChange(next === '' ? unset(['color']) : set(next, ['color']))}
        />
      </ControlRow>

      {renderDefault({
        ...props,
        members: props.members.filter((m) => !('field' in m && m.field.id === 'color')),
      })}
    </Stack>
  )
}
