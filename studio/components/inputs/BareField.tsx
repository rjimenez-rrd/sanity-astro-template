import type {FieldProps} from 'sanity'

/**
 * A field without its title and indented frame: just the input. For fields
 * that are a whole tab on their own (the tab already names them), so the
 * heading would only repeat it.
 */
export function BareField(props: FieldProps) {
  return <>{props.children}</>
}
