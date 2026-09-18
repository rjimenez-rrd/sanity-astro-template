import {type ObjectInputProps} from 'sanity'
import {BlockStylesPreview} from '../BlockStylesPreview'

/** Spacing and motion live on the Advanced tab for containers, as in Elementor. */
const MOVED_TO_ADVANCED = new Set(['padding', 'margin', 'motion'])

/** Replaced by the Style panel above; only shown while they still hold a value. */
const REPLACED_BY_STYLE_PANEL = new Set(['background', 'border', 'borderRadius'])

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (typeof value === 'object') return Object.values(value as object).every(isEmpty)
  return false
}

/**
 * The shared block-styles panel, trimmed to what the Style panel doesn't
 * cover. Existing values in the moved fields still render; newer settings
 * take precedence.
 */
export function ContainerStyleInput(props: ObjectInputProps) {
  const current = (props.value ?? {}) as Record<string, unknown>
  const members = props.members.filter((member) => {
    if (member.kind !== 'field') return true
    if (MOVED_TO_ADVANCED.has(member.name)) return false
    if (REPLACED_BY_STYLE_PANEL.has(member.name)) return !isEmpty(current[member.name])
    return true
  })
  return <BlockStylesPreview {...props} members={members} />
}
