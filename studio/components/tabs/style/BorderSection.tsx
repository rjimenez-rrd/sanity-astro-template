import {ColorPicker} from '../../color/ColorPicker'
import {ControlRow, DimensionsInput, SliderInput, StateTabs, UnitSelect, type Sides} from '../../controls/controls'
import {resolveResponsive, type Responsive} from '../../controls/responsive'
import {BORDER_TYPES, BORDER_UNITS, SHADOW_POSITIONS} from './options'
import {TransitionRow} from './rows'
import {Divider, Dropdown, STATES, type DesignValue, type Path, type SidesValue, type State, type StyleCtx} from './shared'

/**
 * The Border section, per Normal / Hover state: border type, width and color,
 * corner radius, and box shadow.
 */

/** [key, label, min, max, placeholder] for each box-shadow slider. */
const SHADOW_SLIDERS = [
  ['horizontal', 'Horizontal', -100, 100, 0],
  ['vertical', 'Vertical', -100, 100, 0],
  ['blur', 'Blur', 0, 100, 10],
  ['spread', 'Spread', -100, 100, 0],
] as const

export function BorderSection({
  ctx,
  value,
  state,
  onStateChange,
}: {
  ctx: StyleCtx
  value: DesignValue
  state: State
  onStateChange: (state: State) => void
}) {
  const {patch} = ctx
  const base: Path = ['border', state]
  const b = value.border?.[state] ?? {}
  const sh = b.shadow ?? {}
  const hasBorder = Boolean(b.type && b.type !== 'none')

  return (
    <>
      <StateTabs value={state} options={STATES} onChange={onStateChange} />

      <ControlRow label="Border Type">
        <Dropdown value={b.type} options={BORDER_TYPES} onChange={(next) => patch([...base, 'type'], next)} />
      </ControlRow>

      {hasBorder && (
        <>
          <SidesControl ctx={ctx} label="Width" path={[...base, 'width']} current={b.width} />
          <ControlRow label="Color">
            <ColorPicker value={b.color} onChange={(c) => patch([...base, 'color'], c)} />
          </ControlRow>
        </>
      )}

      <SidesControl
        ctx={ctx}
        label="Border Radius"
        path={[...base, 'radius']}
        current={b.radius}
        labels={['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left']}
      />

      <Divider />

      <ControlRow label="Box Shadow Color">
        <ColorPicker value={sh.color} onChange={(c) => patch([...base, 'shadow', 'color'], c)} />
      </ControlRow>
      {sh.color && (
        <>
          {SHADOW_SLIDERS.map(([key, label, min, max, placeholder]) => (
            <ControlRow key={key} label={label} stacked>
              <SliderInput
                size={sh[key]}
                placeholder={placeholder}
                min={min}
                max={max}
                onChange={(n) => patch([...base, 'shadow', key], n)}
              />
            </ControlRow>
          ))}
          <ControlRow label="Position">
            <Dropdown
              value={sh.position}
              options={SHADOW_POSITIONS}
              placeholder="Outline"
              onChange={(next) => patch([...base, 'shadow', 'position'], next)}
            />
          </ControlRow>
        </>
      )}

      {state === 'hover' && <TransitionRow ctx={ctx} path={[...base, 'transition']} current={b.transition} />}
    </>
  )
}

/** Four per-device sides with a unit, as for border width and radius. */
function SidesControl({
  ctx,
  label,
  path,
  current,
  labels,
}: {
  ctx: StyleCtx
  label: string
  path: Path
  current: SidesValue | undefined
  labels?: [string, string, string, string]
}) {
  const {patch, device} = ctx
  const own = current?.[device]
  const resolved = resolveResponsive(current as Responsive<Sides & {unit?: string}>, device)
  const unit = own?.unit ?? resolved.value?.unit ?? 'px'
  return (
    <ControlRow
      label={label}
      responsive={ctx.responsive}
      stacked
      aside={<UnitSelect unit={unit} units={BORDER_UNITS} onChange={(u) => patch([...path, device, 'unit'], u)} />}
    >
      <DimensionsInput
        value={own}
        placeholder={resolved.inherited ? resolved.value : undefined}
        linked={current?.linked ?? true}
        labels={labels}
        onLinkedChange={(linked) => patch([...path, 'linked'], linked)}
        onChange={(next) => {
          const empty = Object.values(next).every((n) => n === undefined)
          patch([...path, device], empty ? undefined : {...next, unit})
        }}
      />
    </ControlRow>
  )
}
