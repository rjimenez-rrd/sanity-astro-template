import type {CSSProperties} from 'react'

/*
 * Small line icons in the style of Elementor's container controls. Each draws
 * two items against the container edges; the controls rotate them to follow
 * the current flex direction.
 */

type IconProps = {style?: CSSProperties}

function Svg({children, style}: {children: React.ReactNode; style?: CSSProperties}) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      style={{display: 'block', transition: 'transform 0.15s ease', ...style}}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Main-axis edges run vertically; items sit along the horizontal axis.
function Justify({x1, x2, style}: {x1: number; x2: number} & IconProps) {
  return (
    <Svg style={style}>
      <path d="M1 2v12M15 2v12" opacity={0.45} />
      <rect x={x1} y={4.5} width={3} height={7} rx={0.5} fill="currentColor" stroke="none" />
      <rect x={x2} y={4.5} width={3} height={7} rx={0.5} fill="currentColor" stroke="none" />
    </Svg>
  )
}

export const JustifyStartIcon = (p: IconProps) => <Justify x1={2.5} x2={6.5} {...p} />
export const JustifyCenterIcon = (p: IconProps) => <Justify x1={4.5} x2={8.5} {...p} />
export const JustifyEndIcon = (p: IconProps) => <Justify x1={6.5} x2={10.5} {...p} />
export const JustifyBetweenIcon = (p: IconProps) => <Justify x1={2.5} x2={10.5} {...p} />
export const JustifyAroundIcon = (p: IconProps) => <Justify x1={3.5} x2={9.5} {...p} />
export const JustifyEvenlyIcon = (p: IconProps) => <Justify x1={4.25} x2={8.75} {...p} />

// Cross-axis edges run horizontally; items of two heights show the alignment.
function Align({a, b, style}: {a: [number, number]; b: [number, number]} & IconProps) {
  return (
    <Svg style={style}>
      <path d="M2 1h12M2 15h12" opacity={0.45} />
      <rect x={4.5} y={a[0]} width={3} height={a[1]} rx={0.5} fill="currentColor" stroke="none" />
      <rect x={8.5} y={b[0]} width={3} height={b[1]} rx={0.5} fill="currentColor" stroke="none" />
    </Svg>
  )
}

export const AlignStartIcon = (p: IconProps) => <Align a={[2.5, 5]} b={[2.5, 8]} {...p} />
export const AlignCenterIcon = (p: IconProps) => <Align a={[5.5, 5]} b={[4, 8]} {...p} />
export const AlignEndIcon = (p: IconProps) => <Align a={[8.5, 5]} b={[5.5, 8]} {...p} />
export const AlignStretchIcon = (p: IconProps) => <Align a={[2.5, 11]} b={[2.5, 11]} {...p} />

export const NoWrapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 4v8M5 8h8.5M11 5.5 13.5 8 11 10.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const WrapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M13.5 4v8M2.5 4.5h6a2.75 2.75 0 0 1 0 5.5H3.5M5.5 7.75 3.25 10 5.5 12.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

/** Order: move to the start — an arrow into the leading edge. */
export const OrderStartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 3.5v9M13.5 8H5M8 5 5 8l3 3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

/** Order: move to the end — an arrow into the trailing edge. */
export const OrderEndIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3.5v9M2.5 8H11M8 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

/** Background type: classic (solid color / image). */
export const BrushIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M13.5 2.5 7 9M6.2 9.8c-1.6-.1-2.9 1-3 2.6-.1 1-.5 1.4-1.2 1.6 2.4.6 5.1.1 5.3-2.3M7 9l.8.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

/** Background type: gradient. */
export const GradientIcon = (p: IconProps) => (
  <Svg {...p}>
    <defs>
      <linearGradient id="pb-gradient-icon" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="currentColor" stopOpacity="1" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="12" height="10" rx="1.5" fill="url(#pb-gradient-icon)" stroke="none" />
  </Svg>
)
