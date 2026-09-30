import type {ReactNode} from 'react'
import {type StringInputProps, set, unset} from 'sanity'
import {ControlRow, IconToggleGroup, type IconOption} from '../controls/controls'

// Filled square = icon, lines = heading and text, drawn in the shared control-icon style.
function LayoutIcon({children}: {children: ReactNode}) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const OPTIONS: IconOption[] = [
  {
    value: 'left',
    title: 'Left: icon left, text right',
    icon: (
      <LayoutIcon>
        <rect x={1.5} y={5.5} width={4} height={4} rx={0.5} fill="currentColor" stroke="none" />
        <path d="M7.5 5.5h6M7.5 8h7M7.5 10.5h5.5" />
      </LayoutIcon>
    ),
  },
  {
    value: 'center',
    title: 'Center: icon above, text below',
    icon: (
      <LayoutIcon>
        <rect x={6} y={1.5} width={4} height={4} rx={0.5} fill="currentColor" stroke="none" />
        <path d="M4.5 8.5h7M3.5 11.5h9" />
      </LayoutIcon>
    ),
  },
  {
    value: 'right',
    title: 'Right: text left, icon right',
    icon: (
      <LayoutIcon>
        <path d="M2.5 5.5h6M1.5 8h7M3 10.5h5.5" />
        <rect x={10.5} y={5.5} width={4} height={4} rx={0.5} fill="currentColor" stroke="none" />
      </LayoutIcon>
    ),
  },
]

/** Where the icon sits relative to the text. Clicking the selected option clears it. */
export function IconTextAlignmentInput(props: StringInputProps) {
  const {value, onChange} = props

  return (
    <ControlRow label="Layout">
      <IconToggleGroup
        options={OPTIONS}
        value={value}
        onChange={(next) => onChange(next === undefined ? unset() : set(next))}
      />
    </ControlRow>
  )
}
