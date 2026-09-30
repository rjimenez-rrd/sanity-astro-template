/**
 * Shape Dividers: the shapes a container can have along its top or bottom
 * edge (Style -> Shape Divider). Keep the names in step with studio
 * fields/style.ts SHAPE_TYPES.
 *
 * Each shape is its edge line across a 1000×100 box, from x=0 to x=1000,
 * drawn for the top edge; the bottom one is the same turned upside down.
 * Filled towards the edge it's the normal shape; filled away from it, the
 * inverted one — so both come from the same line. Some shapes have faded
 * layers, back to front.
 */
type Layer = {edge: string; opacity?: number}

const zigzag = () => {
  let d = 'M0,0'
  for (let x = 20; x <= 1000; x += 20) d += ` L${x},${(x / 20) % 2 === 1 ? 100 : 0}`
  return d
}

export const SHAPES: Record<string, Layer[]> = {
  tilt: [{edge: 'M0,0 L1000,100'}],
  'opacity-tilt': [
    {edge: 'M0,0 L1000,100', opacity: 0.33},
    {edge: 'M0,0 L1000,66', opacity: 0.5},
    {edge: 'M0,0 L1000,33'},
  ],
  triangle: [{edge: 'M0,0 L500,100 L1000,0'}],
  'triangle-asymmetrical': [{edge: 'M0,0 L700,100 L1000,0'}],
  arrow: [{edge: 'M0,20 L470,20 L500,100 L530,20 L1000,20'}],
  curve: [{edge: 'M0,0 Q500,200 1000,0'}],
  'curve-asymmetrical': [{edge: 'M0,0 C300,140 850,110 1000,0'}],
  wave: [{edge: 'M0,50 C250,110 250,-10 500,50 C750,110 750,-10 1000,50'}],
  waves: [
    {edge: 'M0,80 C200,20 300,20 500,70 C700,110 800,40 1000,60', opacity: 0.33},
    {edge: 'M0,60 C250,110 350,0 600,50 C800,90 900,20 1000,40', opacity: 0.5},
    {edge: 'M0,40 C200,80 300,0 500,30 C700,60 800,10 1000,20'},
  ],
  mountains: [
    {edge: 'M0,70 L150,30 L300,85 L450,25 L600,80 L750,35 L900,90 L1000,45', opacity: 0.33},
    {edge: 'M0,45 L200,90 L400,40 L600,95 L800,50 L1000,85', opacity: 0.5},
    {edge: 'M0,20 L250,60 L500,15 L750,70 L1000,25'},
  ],
  pyramids: [{edge: 'M0,0 L100,60 L200,20 L300,80 L400,10 L500,100 L600,10 L700,80 L800,20 L900,60 L1000,0'}],
  zigzag: [{edge: zigzag()}],
  book: [{edge: 'M0,0 C250,0 400,90 500,100 C600,90 750,0 1000,0'}],
}

/** The fill for one layer: towards the edge (y=0), or away from it (inverted). */
export function shapePath(edge: string, invert: boolean): string {
  return `${edge} V${invert ? 100 : 0} H0 Z`
}
