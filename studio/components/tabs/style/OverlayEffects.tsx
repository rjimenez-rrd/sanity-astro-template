import {ControlRow} from '../../controls/controls'
import {CssFilters} from '../../controls/CssFilters'
import {BLEND_MODES} from './options'
import {ResponsiveSlider} from './rows'
import {Dropdown, type BackgroundState, type Path, type StyleCtx} from './shared'

/**
 * Background Overlay extras, shown once an overlay type is chosen: Opacity,
 * CSS Filters (a collapsible group) and Blend Mode.
 */

// The empty choice already reads "Normal", so the stored 'normal' isn't listed again.
const BLEND_MODE_CHOICES = BLEND_MODES.filter(([value]) => value !== 'normal')

export function OverlayEffects({
  ctx,
  base,
  bg,
  filtersOpen,
  onFiltersToggle,
}: {
  ctx: StyleCtx
  base: Path
  bg: BackgroundState
  filtersOpen: boolean
  onFiltersToggle: () => void
}) {
  const {patch} = ctx
  return (
    <>
      <ResponsiveSlider ctx={ctx} label="Opacity" path={[...base, 'opacity']} current={bg.opacity} max={1} step={0.01} fallback={0.5} />

      <CssFilters
        value={bg.filters}
        open={filtersOpen}
        onToggle={onFiltersToggle}
        onChange={(key, n) => patch([...base, 'filters', key], n)}
      />

      <ControlRow label="Blend Mode">
        <Dropdown
          value={bg.blendMode}
          options={BLEND_MODE_CHOICES}
          placeholder="Normal"
          onChange={(next) => patch([...base, 'blendMode'], next)}
        />
      </ControlRow>
    </>
  )
}
