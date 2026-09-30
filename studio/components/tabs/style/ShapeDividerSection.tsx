import {ColorPicker} from '../../color/ColorPicker'
import {ControlRow, StateTabs} from '../../controls/controls'
import {SHAPE_TYPES} from './options'
import {ResponsiveSlider, SwitchRow} from './rows'
import {Dropdown, type DesignValue, type Path, type StyleCtx} from './shared'

/**
 * The Shape Divider section (containers and columns only): a shape along the
 * Top or Bottom edge, switched with tabs where other sections have Normal / Hover.
 */

export type Edge = 'top' | 'bottom'

const EDGES: {value: Edge; title: string}[] = [
  {value: 'top', title: 'Top'},
  {value: 'bottom', title: 'Bottom'},
]

export function ShapeDividerSection({
  ctx,
  value,
  edge,
  onEdgeChange,
}: {
  ctx: StyleCtx
  value: DesignValue
  edge: Edge
  onEdgeChange: (edge: Edge) => void
}) {
  const {patch} = ctx
  const base: Path = ['shapeDivider', edge]
  const sd = value.shapeDivider?.[edge] ?? {}
  return (
    <>
      <StateTabs value={edge} options={EDGES} onChange={onEdgeChange} />
      <ControlRow label="Type">
        <Dropdown value={sd.type} options={SHAPE_TYPES} placeholder="None" onChange={(next) => patch([...base, 'type'], next)} />
      </ControlRow>
      {sd.type && (
        <>
          <ControlRow label="Color">
            <ColorPicker value={sd.color} onChange={(c) => patch([...base, 'color'], c)} />
          </ControlRow>
          <ResponsiveSlider ctx={ctx} label="Width" path={[...base, 'width']} current={sd.width} unit="%" min={100} max={300} fallback={100} />
          <ResponsiveSlider ctx={ctx} label="Height" path={[...base, 'height']} current={sd.height} unit="px" max={500} />
          <SwitchRow ctx={ctx} label="Flip" path={[...base, 'flip']} checked={sd.flip} />
          <SwitchRow ctx={ctx} label="Invert" path={[...base, 'invert']} checked={sd.invert} />
          <SwitchRow
            ctx={ctx}
            label="Bring to Front"
            path={[...base, 'front']}
            checked={sd.front}
            hint="Draws the shape over the content instead of behind it."
          />
        </>
      )}
    </>
  )
}
