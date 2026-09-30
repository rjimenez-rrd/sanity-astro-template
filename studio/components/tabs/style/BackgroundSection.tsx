import {FormInput} from 'sanity'
import {Card, Text} from '@sanity/ui'
import {ImagesIcon, PlayIcon} from '@sanity/icons'
import {ColorPicker} from '../../color/ColorPicker'
import {ControlRow, IconToggleGroup, StateTabs} from '../../controls/controls'
import {BrushIcon, GradientIcon} from '../../controls/icons'
import {BG_ATTACHMENTS, BG_POSITIONS, BG_REPEATS, BG_SIZES, GRADIENT_TYPES, IMAGE_RESOLUTIONS} from './options'
import {SlideshowControls, VideoControls} from './BackgroundMedia'
import {OverlayEffects} from './OverlayEffects'
import {ResponsiveDropdown, ResponsiveSlider, TransitionRow} from './rows'
import {Divider, Dropdown, STATES, type BackgroundState, type DesignValue, type Path, type State, type StyleCtx} from './shared'

/**
 * The Background and Background Overlay sections: both store the same shape
 * per Normal / Hover state, so one component draws either. The overlay adds
 * Opacity, CSS Filters and Blend Mode; the Background's Normal state adds
 * Video and Slideshow for sections.
 */

const TYPES = [
  {value: 'classic', title: 'Classic', icon: <BrushIcon />},
  {value: 'gradient', title: 'Gradient', icon: <GradientIcon />},
]

/** Background Video and Slideshow: the Background's Normal state only, as in Elementor. */
const MEDIA_TYPES = [
  {value: 'video', title: 'Video', icon: <PlayIcon />},
  {value: 'slideshow', title: 'Slideshow', icon: <ImagesIcon />},
]

/** Which background-image field holds each device's image. */
const IMAGE_FIELD = {desktop: 'image', tablet: 'imageTablet', mobile: 'imageMobile'} as const

export function BackgroundSection({
  ctx,
  section,
  value,
  state,
  onStateChange,
  sectionFeatures,
  overlayEffects,
}: {
  ctx: StyleCtx
  section: 'background' | 'overlay'
  value: DesignValue
  state: State
  onStateChange: (state: State) => void
  sectionFeatures: boolean
  /** Overlay only: the CSS Filters group's open state, kept by the panel. */
  overlayEffects?: {filtersOpen: boolean; onFiltersToggle: () => void}
}) {
  const base: Path = [section, state]
  const bg = value[section]?.[state] ?? {}
  const type = bg.type
  const withMedia = sectionFeatures && section === 'background' && state === 'normal'

  return (
    <>
      <StateTabs value={state} options={STATES} onChange={onStateChange} />

      <ControlRow label={section === 'overlay' ? 'Overlay Type' : 'Background Type'}>
        <IconToggleGroup
          options={withMedia ? [...TYPES, ...MEDIA_TYPES] : TYPES}
          value={type}
          onChange={(next) => ctx.patch([...base, 'type'], next)}
        />
      </ControlRow>

      {type === 'classic' && <ClassicControls ctx={ctx} base={base} bg={bg} />}
      {type === 'video' && <VideoControls ctx={ctx} base={base} bg={bg} />}
      {type === 'slideshow' && <SlideshowControls ctx={ctx} base={base} bg={bg} />}
      {type === 'gradient' && <GradientControls ctx={ctx} base={base} bg={bg} />}

      {overlayEffects && type && <OverlayEffects ctx={ctx} base={base} bg={bg} {...overlayEffects} />}

      {state === 'hover' && <TransitionRow ctx={ctx} path={[...base, 'transition']} current={bg.transition} />}
    </>
  )
}

type TypeProps = {ctx: StyleCtx; base: Path; bg: BackgroundState}

/** Classic: a color plus an optional per-device image and its placement. */
function ClassicControls({ctx, base, bg}: TypeProps) {
  const {patch, device} = ctx
  return (
    <>
      <ControlRow label="Color">
        <ColorPicker value={bg.color} onChange={(c) => patch([...base, 'color'], c)} />
      </ControlRow>

      <ControlRow
        label="Image"
        responsive={ctx.responsive}
        stacked
        hint={
          device !== 'desktop' && !bg[IMAGE_FIELD[device]]?.asset
            ? `Empty: uses the ${device === 'mobile' && bg.imageTablet?.asset ? 'Tablet' : 'Desktop'} image. Add one to replace it on ${device}.`
            : undefined
        }
      >
        {/* One uploader per device; key forces a fresh input when the device changes. */}
        <FormInput key={device} {...ctx.inputProps} relativePath={[...base, IMAGE_FIELD[device]]} />
      </ControlRow>

      {Boolean(bg.image?.asset || bg.imageTablet?.asset || bg.imageMobile?.asset) && (
        <>
          <ControlRow label="Image Resolution" hint="Full uses the original, up to 2560px wide.">
            <Dropdown
              value={bg.imageResolution}
              options={IMAGE_RESOLUTIONS}
              placeholder="Full"
              onChange={(next) => patch([...base, 'imageResolution'], next)}
            />
          </ControlRow>
          <Divider />
          <ResponsiveDropdown ctx={ctx} label="Position" path={[...base, 'position']} current={bg.position} options={BG_POSITIONS} />
          <ControlRow label="Attachment">
            <Dropdown
              value={bg.attachment}
              options={BG_ATTACHMENTS}
              onChange={(next) => patch([...base, 'attachment'], next)}
            />
          </ControlRow>
          <ResponsiveDropdown ctx={ctx} label="Repeat" path={[...base, 'repeat']} current={bg.repeat} options={BG_REPEATS} />
          <ResponsiveDropdown ctx={ctx} label="Display Size" path={[...base, 'size']} current={bg.size} options={BG_SIZES} />
        </>
      )}
    </>
  )
}

/** Gradient: two color stops, then an angle (linear) or a center (radial). */
function GradientControls({ctx, base, bg}: TypeProps) {
  const {patch} = ctx
  const g = bg.gradient ?? {}
  const path: Path = [...base, 'gradient']
  return (
    <>
      <Card
        padding={3}
        radius={2}
        tone="caution"
        style={{borderLeft: '3px solid var(--card-badge-caution-dot-color, orange)'}}
      >
        <Text size={1} style={{fontStyle: 'italic', lineHeight: 1.5}}>
          Set locations and angle for each breakpoint to ensure the gradient adapts to
          different screen sizes.
        </Text>
      </Card>
      <ControlRow label="Color">
        <ColorPicker value={g.color} onChange={(c) => patch([...path, 'color'], c)} />
      </ControlRow>
      <ResponsiveSlider ctx={ctx} label="Location" path={[...path, 'location']} current={g.location} unit="%" max={100} fallback={0} />
      <ControlRow label="Second Color">
        <ColorPicker value={g.secondColor} onChange={(c) => patch([...path, 'secondColor'], c)} />
      </ControlRow>
      <ResponsiveSlider
        ctx={ctx}
        label="Location"
        path={[...path, 'secondLocation']}
        current={g.secondLocation}
        unit="%"
        max={100}
        fallback={100}
      />
      <ControlRow label="Type">
        <Dropdown
          value={g.gradientType}
          options={GRADIENT_TYPES}
          placeholder="Linear"
          onChange={(next) => patch([...path, 'gradientType'], next)}
        />
      </ControlRow>
      {g.gradientType === 'radial' ? (
        <ControlRow label="Position">
          <Dropdown
            value={g.position}
            options={BG_POSITIONS}
            placeholder="Center Center"
            onChange={(next) => patch([...path, 'position'], next)}
          />
        </ControlRow>
      ) : (
        <ResponsiveSlider ctx={ctx} label="Angle" path={[...path, 'angle']} current={g.angle} unit="deg" max={360} fallback={180} />
      )}
    </>
  )
}
