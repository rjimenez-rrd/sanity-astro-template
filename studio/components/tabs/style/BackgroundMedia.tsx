import {FormInput} from 'sanity'
import {TextInput} from '@sanity/ui'
import {ControlRow} from '../../controls/controls'
import {BG_POSITIONS, BG_SIZES, KEN_BURNS_DIRECTIONS, SLIDESHOW_TRANSITIONS} from './options'
import {NumberRow, SwitchRow} from './rows'
import {Dropdown, type BackgroundState, type Path, type StyleCtx} from './shared'

/**
 * Background Video and Slideshow controls: only for containers and columns
 * (sectionFeatures), and only in the Background's Normal state, as in Elementor.
 */

type MediaProps = {ctx: StyleCtx; base: Path; bg: BackgroundState}

export function VideoControls({ctx, base, bg}: MediaProps) {
  const {patch, inputProps} = ctx
  return (
    <>
      <ControlRow
        label="Video Link"
        stacked
        hint="YouTube or Vimeo link, or a direct .mp4 / .webm link. Or upload a file below."
      >
        <TextInput
          fontSize={1}
          value={bg.video?.url ?? ''}
          placeholder="https://www.youtube.com/watch?v=…"
          onChange={(e) => patch([...base, 'video', 'url'], e.currentTarget.value.trim())}
        />
      </ControlRow>
      <ControlRow label="Video File" stacked>
        <FormInput {...inputProps} relativePath={[...base, 'video', 'file']} />
      </ControlRow>
      <NumberRow ctx={ctx} label="Start Time" path={[...base, 'video', 'start']} current={bg.video?.start} placeholder="0" hint="In seconds." />
      <NumberRow
        ctx={ctx}
        label="End Time"
        path={[...base, 'video', 'end']}
        current={bg.video?.end}
        placeholder="End"
        hint="In seconds. Empty plays to the end."
      />
      <SwitchRow ctx={ctx} label="Play Once" path={[...base, 'video', 'playOnce']} checked={bg.video?.playOnce} />
      <SwitchRow
        ctx={ctx}
        label="Play On Mobile"
        path={[...base, 'video', 'playOnMobile']}
        checked={bg.video?.playOnMobile}
        hint="Off: phones show the fallback image instead, saving their data."
      />
      <ControlRow label="Background Fallback" stacked hint="Shown while the video loads, and on phones when it doesn't play.">
        <FormInput {...inputProps} relativePath={[...base, 'video', 'fallback']} />
      </ControlRow>
    </>
  )
}

export function SlideshowControls({ctx, base, bg}: MediaProps) {
  const {patch, inputProps} = ctx
  const s = bg.slideshow
  return (
    <>
      <ControlRow label="Images" stacked>
        <FormInput {...inputProps} relativePath={[...base, 'slideshow', 'images']} />
      </ControlRow>
      <SwitchRow ctx={ctx} label="Infinite Loop" path={[...base, 'slideshow', 'loop']} checked={s?.loop ?? true} />
      <NumberRow
        ctx={ctx}
        label="Duration (ms)"
        path={[...base, 'slideshow', 'duration']}
        current={s?.duration}
        placeholder="5000"
        hint="How long each image shows."
      />
      <ControlRow label="Transition">
        <Dropdown
          value={s?.transition}
          options={SLIDESHOW_TRANSITIONS}
          placeholder="Fade"
          onChange={(next) => patch([...base, 'slideshow', 'transition'], next)}
        />
      </ControlRow>
      <NumberRow
        ctx={ctx}
        label="Transition Duration (ms)"
        path={[...base, 'slideshow', 'transitionDuration']}
        current={s?.transitionDuration}
        placeholder="500"
      />
      <ControlRow label="Background Size">
        <Dropdown
          value={s?.size}
          options={BG_SIZES}
          placeholder="Cover"
          onChange={(next) => patch([...base, 'slideshow', 'size'], next)}
        />
      </ControlRow>
      <ControlRow label="Background Position">
        <Dropdown
          value={s?.position}
          options={BG_POSITIONS}
          placeholder="Center Center"
          onChange={(next) => patch([...base, 'slideshow', 'position'], next)}
        />
      </ControlRow>
      <SwitchRow
        ctx={ctx}
        label="Ken Burns Effect"
        path={[...base, 'slideshow', 'kenBurns']}
        checked={s?.kenBurns}
        hint="A slow zoom on each image."
      />
      {s?.kenBurns && (
        <ControlRow label="Direction">
          <Dropdown
            value={s?.kenBurnsDirection}
            options={KEN_BURNS_DIRECTIONS}
            placeholder="In"
            onChange={(next) => patch([...base, 'slideshow', 'kenBurnsDirection'], next)}
          />
        </ControlRow>
      )}
    </>
  )
}
