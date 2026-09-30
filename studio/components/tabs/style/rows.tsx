import {Flex, Switch, TextInput} from '@sanity/ui'
import {ControlRow, SliderInput, UnitSelect} from '../../controls/controls'
import {resolveResponsive, type Responsive} from '../../controls/responsive'
import {type Option} from './options'
import {Dropdown, type Path, type StyleCtx} from './shared'

/**
 * Generic control rows bound to one leaf of the Style value, shared by the
 * Background, Border and Shape Divider sections.
 */

/** An on/off switch for one boolean leaf. */
export function SwitchRow({
  ctx,
  label,
  path,
  checked,
  hint,
}: {
  ctx: StyleCtx
  label: string
  path: Path
  checked: boolean | undefined
  hint?: string
}) {
  return (
    <ControlRow label={label} hint={hint}>
      <Flex justify="flex-end">
        <Switch checked={Boolean(checked)} onChange={(e) => ctx.patch(path, e.currentTarget.checked || undefined)} />
      </Flex>
    </ControlRow>
  )
}

/** A number box for one leaf; emptying it clears the value. */
export function NumberRow({
  ctx,
  label,
  path,
  current,
  placeholder,
  hint,
}: {
  ctx: StyleCtx
  label: string
  path: Path
  current: number | undefined
  placeholder?: string
  hint?: string
}) {
  return (
    <ControlRow label={label} hint={hint}>
      <TextInput
        fontSize={1}
        type="number"
        value={current ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.currentTarget.value
          ctx.patch(path, raw === '' ? undefined : Number(raw))
        }}
      />
    </ControlRow>
  )
}

/** Dropdown bound to one device of a responsive string. */
export function ResponsiveDropdown({
  ctx,
  label,
  path,
  current,
  options,
}: {
  ctx: StyleCtx
  label: string
  path: Path
  current: Responsive<string> | undefined
  options: Option[]
}) {
  const {device} = ctx
  const resolved = resolveResponsive(current, device)
  const inheritedLabel =
    resolved.inherited && resolved.value
      ? `Default (${options.find(([v]) => v === resolved.value)?.[1] ?? resolved.value})`
      : 'Default'
  return (
    <ControlRow label={label} responsive={ctx.responsive}>
      <Dropdown
        value={current?.[device]}
        options={options}
        placeholder={inheritedLabel}
        onChange={(next) => ctx.patch([...path, device], next)}
      />
    </ControlRow>
  )
}

/** Slider bound to one device of a responsive number; empty inherits. */
export function ResponsiveSlider({
  ctx,
  label,
  path,
  current,
  unit,
  min,
  max,
  step,
  fallback,
}: {
  ctx: StyleCtx
  label: string
  path: Path
  current: Responsive<number> | undefined
  unit?: string
  min?: number
  max: number
  step?: number
  fallback?: number
}) {
  const {device} = ctx
  const resolved = resolveResponsive(current, device)
  return (
    <ControlRow
      label={label}
      responsive={ctx.responsive}
      stacked
      aside={unit ? <UnitSelect unit={unit} units={[unit]} onChange={() => {}} /> : undefined}
    >
      <SliderInput
        size={current?.[device]}
        placeholder={resolved.inherited ? resolved.value : fallback}
        min={min}
        max={max}
        step={step}
        onChange={(n) => ctx.patch([...path, device], n)}
      />
    </ControlRow>
  )
}

/** Hover state only: how long the change from Normal takes, in seconds. */
export function TransitionRow({ctx, path, current}: {ctx: StyleCtx; path: Path; current: number | undefined}) {
  return (
    <ControlRow label="Transition Duration" stacked aside={<UnitSelect unit="s" units={['s']} onChange={() => {}} />}>
      <SliderInput size={current} placeholder={0.3} max={3} step={0.1} onChange={(n) => ctx.patch(path, n)} />
    </ControlRow>
  )
}
