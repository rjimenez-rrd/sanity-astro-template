import type {ObjectInputProps} from 'sanity'

/**
 * Image input for logos: puts a white background behind the preview so a
 * transparent logo stays visible in the Studio's dark theme. The background
 * sits on the <img> itself, so it fills the logo's transparent pixels without
 * restyling the rest of the input.
 */
export function LogoInput(props: ObjectInputProps) {
  return (
    <div data-logo-input="">
      <style>{`[data-logo-input] img { background-color: #fff; }`}</style>
      {props.renderDefault(props)}
    </div>
  )
}
