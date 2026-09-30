import {Button, Card, Stack} from '@sanity/ui'
import {EditIcon} from '@sanity/icons'
import {ControlRow, SliderInput, UnitSelect} from '../../controls/controls'
import {BLEND_MODES} from './options'
import {ResponsiveSlider} from './rows'
import {Dropdown, type BackgroundState, type Path, type StyleCtx} from './shared'

/**
 * Background Overlay extras, shown once an overlay type is chosen: Opacity,
 * CSS Filters (a collapsible group) and Blend Mode.
 */

const FILTERS = [
  {key: 'blur', label: 'Blur', unit: 'px', max: 10, step: 0.1, placeholder: 0},
  {key: 'brightness', label: 'Brightness', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'contrast', label: 'Contrast', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'saturate', label: 'Saturation', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'hue', label: 'Hue', unit: 'deg', max: 360, step: 1, placeholder: 0},
] as const

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

      <ControlRow label="CSS Filters">
        <Button
          mode={filtersOpen ? 'default' : 'ghost'}
          tone={filtersOpen ? 'primary' : 'default'}
          icon={EditIcon}
          padding={2}
          aria-label="Edit CSS filters"
          aria-expanded={filtersOpen}
          onClick={onFiltersToggle}
        />
      </ControlRow>
      {filtersOpen && (
        <Card padding={3} radius={2} border>
          <Stack space={4}>
            {FILTERS.map((f) => (
              <ControlRow
                key={f.key}
                label={f.label}
                stacked
                aside={<UnitSelect unit={f.unit} units={[f.unit]} onChange={() => {}} />}
              >
                <SliderInput
                  size={bg.filters?.[f.key]}
                  placeholder={f.placeholder}
                  max={f.max}
                  step={f.step}
                  onChange={(n) => patch([...base, 'filters', f.key], n)}
                />
              </ControlRow>
            ))}
          </Stack>
        </Card>
      )}

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
