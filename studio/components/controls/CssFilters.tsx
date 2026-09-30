import {Button, Card, Stack} from '@sanity/ui'
import {EditIcon} from '@sanity/icons'
import {ControlRow, SliderInput, UnitSelect} from './controls'

/**
 * Elementor's CSS Filters: a pencil button that opens Blur, Brightness,
 * Contrast, Saturation and Hue sliders. Stored as plain numbers under these
 * keys; the frontend turns them into a CSS `filter` (lib/design.ts filters()).
 */

export const CSS_FILTERS = [
  {key: 'blur', label: 'Blur', unit: 'px', max: 10, step: 0.1, placeholder: 0},
  {key: 'brightness', label: 'Brightness', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'contrast', label: 'Contrast', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'saturate', label: 'Saturation', unit: '%', max: 200, step: 1, placeholder: 100},
  {key: 'hue', label: 'Hue', unit: 'deg', max: 360, step: 1, placeholder: 0},
] as const

export type CssFilterKey = (typeof CSS_FILTERS)[number]['key']
export type CssFilterValues = Partial<Record<CssFilterKey, number>>

export function CssFilters({
  value,
  open,
  onToggle,
  onChange,
}: {
  value: CssFilterValues | undefined
  open: boolean
  onToggle: () => void
  /** undefined clears that filter. */
  onChange: (key: CssFilterKey, next: number | undefined) => void
}) {
  return (
    <>
      <ControlRow label="CSS Filters">
        <Button
          mode={open ? 'default' : 'ghost'}
          tone={open ? 'primary' : 'default'}
          icon={EditIcon}
          padding={2}
          aria-label="Edit CSS filters"
          aria-expanded={open}
          onClick={onToggle}
        />
      </ControlRow>
      {open && (
        <Card padding={3} radius={2} border>
          <Stack space={4}>
            {CSS_FILTERS.map((f) => (
              <ControlRow
                key={f.key}
                label={f.label}
                stacked
                aside={<UnitSelect unit={f.unit} units={[f.unit]} onChange={() => {}} />}
              >
                <SliderInput
                  size={value?.[f.key]}
                  placeholder={f.placeholder}
                  max={f.max}
                  step={f.step}
                  onChange={(n) => onChange(f.key, n)}
                />
              </ControlRow>
            ))}
          </Stack>
        </Card>
      )}
    </>
  )
}
