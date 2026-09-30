import {useCallback, useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {Card} from '@sanity/ui'
import {type Device} from '../../controls/responsive'
import {BackgroundSection} from './BackgroundSection'
import {BorderSection} from './BorderSection'
import {ShapeDividerSection, type Edge} from './ShapeDividerSection'
import {Section, type DesignValue, type Path, type State, type StyleCtx} from './shared'

/**
 * The Elementor-style Style tab panel (styleField's input): Background,
 * Background Overlay, Border and Shape Divider sections. This component keeps
 * the panel's UI state (open sections, device, Normal / Hover per section) so
 * it survives a section being collapsed, and hands each section the writer.
 */
export function StyleInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const v = (value ?? {}) as DesignValue
  // styleField({hideBorder}): the block keeps its border in Block Styles.
  const hideBorder = Boolean((props.schemaType.options as {hideBorder?: boolean} | undefined)?.hideBorder)
  // styleField({sectionFeatures}): containers and columns get video,
  // slideshow and shape dividers.
  const sectionFeatures = Boolean(
    (props.schemaType.options as {sectionFeatures?: boolean} | undefined)?.sectionFeatures,
  )

  const [device, setDevice] = useState<Device>('desktop')
  const [open, setOpen] = useState({background: true, overlay: false, border: false, shape: false})
  const [edge, setEdge] = useState<Edge>('bottom')
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Normal / Hover per section; the Shape Divider has Top / Bottom instead (edge).
  const [states, setStates] = useState<Record<'background' | 'overlay' | 'border', State>>({
    background: 'normal',
    overlay: 'normal',
    border: 'normal',
  })

  /** Writes one leaf, creating missing parent objects on the way. */
  const patch = useCallback(
    (path: Path, next: unknown) => {
      const ops: FormPatch[] = [setIfMissing({})]
      for (let i = 1; i < path.length; i++) ops.push(setIfMissing({}, path.slice(0, i)))
      ops.push(next === undefined || next === '' ? unset(path) : set(next, path))
      onChange(ops)
    },
    [onChange],
  )

  const ctx: StyleCtx = {patch, device, responsive: {device, onDevice: setDevice}, inputProps: props}
  const toggle = (key: keyof typeof open) => setOpen((o) => ({...o, [key]: !o[key]}))
  const setState = (key: keyof typeof states) => (s: State) => setStates((prev) => ({...prev, [key]: s}))

  return (
    <Card border radius={2} overflow="hidden">
      <Section title="Background" open={open.background} onToggle={() => toggle('background')}>
        <BackgroundSection
          ctx={ctx}
          section="background"
          value={v}
          state={states.background}
          onStateChange={setState('background')}
          sectionFeatures={sectionFeatures}
        />
      </Section>
      <Section title="Background Overlay" open={open.overlay} onToggle={() => toggle('overlay')}>
        <BackgroundSection
          ctx={ctx}
          section="overlay"
          value={v}
          state={states.overlay}
          onStateChange={setState('overlay')}
          sectionFeatures={sectionFeatures}
          overlayEffects={{filtersOpen, onFiltersToggle: () => setFiltersOpen((o) => !o)}}
        />
      </Section>
      {!hideBorder && (
        <Section title="Border" open={open.border} onToggle={() => toggle('border')}>
          <BorderSection ctx={ctx} value={v} state={states.border} onStateChange={setState('border')} />
        </Section>
      )}
      {sectionFeatures && (
        <Section title="Shape Divider" open={open.shape} onToggle={() => toggle('shape')}>
          <ShapeDividerSection ctx={ctx} value={v} edge={edge} onEdgeChange={setEdge} />
        </Section>
      )}
    </Card>
  )
}
