import {ColorPicker} from '../color/ColorPicker'

/**
 * The Studio's shared color control: swatch + inline text, with the
 * Elementor-style picker (saturation, hue, alpha, HEXA/RGBA/HSLA) on click.
 */
export function ColorInput({
  value,
  onChange,
  placeholder,
  fallback,
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  /** Swatch shown while the field is empty. Display only — never written to the document. */
  fallback?: string
}) {
  return (
    <ColorPicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      fallback={fallback}
      showInput
    />
  )
}
