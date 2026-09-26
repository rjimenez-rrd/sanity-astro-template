import {useId} from 'react'
import {Flex, Stack, Switch, Text} from '@sanity/ui'
import {set, type ObjectInputProps} from 'sanity'

type LogoValue = {asset?: unknown; whiteBackground?: boolean}

/**
 * Image input for logos: puts a white background behind the preview so a
 * transparent logo stays visible in the Studio's dark theme. The background
 * sits on the <img> itself, so it fills the logo's transparent pixels without
 * restyling the rest of the input.
 *
 * The switch turns that background off, e.g. to check a light logo, and is
 * saved on the logo as `whiteBackground` (site-settings.ts). It only changes
 * this preview, not the site.
 */
export function LogoInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const logo = value as LogoValue | undefined
  // Unset means on: the preview had a white background before the switch.
  const whiteBackground = logo?.whiteBackground !== false
  // Scopes the style to this input, so each logo field has its own switch.
  const scope = useId()

  return (
    <Stack gap={3} data-logo-input={scope}>
      {whiteBackground && (
        <style>{`[data-logo-input="${scope}"] img { background-color: #fff; }`}</style>
      )}
      {props.renderDefault(props)}
      {/* Only with an image: saving the switch alone would leave a logo
          field holding a setting but no picture. */}
      {logo?.asset ? (
        <Flex align="center" gap={2}>
          <Switch
            id={`${scope}-white`}
            checked={whiteBackground}
            readOnly={props.readOnly}
            onChange={(event) => onChange(set(event.currentTarget.checked, ['whiteBackground']))}
          />
          <Text as="label" htmlFor={`${scope}-white`} size={1} muted>
            White background in preview
          </Text>
        </Flex>
      ) : null}
    </Stack>
  )
}
