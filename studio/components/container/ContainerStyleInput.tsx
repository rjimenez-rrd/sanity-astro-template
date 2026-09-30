import {type ObjectInputProps} from 'sanity'
import {BlockStylesPreview} from '../previews/BlockStylesPreview'

/**
 * Spacing and motion live on the Advanced tab, as in Elementor. Older values
 * saved here still show until cleared.
 */
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
/** Kept, always shown, when the field asks for keepBorder (see styleField). */
const KEPT_BORDER = new Set(['border', 'borderRadius'])

export function ContainerStyleInput(props: ObjectInputProps) {
  const current = (props.value ?? {}) as Record<string, unknown>
  const keepBorder = Boolean((props.schemaType.options as {keepBorder?: boolean} | undefined)?.keepBorder)
  const members = props.members.filter((member) => {
    if (member.kind !== 'field') return true
    // Shown while they still hold a value, so saved spacing that still renders
    // can be seen and cleared; the Advanced tab's own values win side by side.
    if (MOVED_TO_ADVANCED.has(member.name)) return !isEmpty(current[member.name])
    if (keepBorder && KEPT_BORDER.has(member.name)) return true
    if (REPLACED_BY_STYLE_PANEL.has(member.name)) return !isEmpty(current[member.name])
    return true
  })
  return <BlockStylesPreview {...props} members={members} />
}
