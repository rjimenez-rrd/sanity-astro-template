import {useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent} from 'react'
import {Box, Button, Card, Flex, Popover, Stack, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {ResetIcon} from '@sanity/icons'
import {clamp, detectFormat, formatColor, parseColor, toCss, type ColorFormat, type Hsva} from './color'

const DEBOUNCE_MS = 150
const DEFAULT: Hsva = {h: 0, s: 0, v: 0, a: 1}
const FORMATS: {value: ColorFormat; label: string}[] = [
  {value: 'hexa', label: 'HEXA'},
  {value: 'rgba', label: 'RGBA'},
  {value: 'hsla', label: 'HSLA'},
]

/** Checkerboard so transparency is visible, as in Elementor's picker. */
const CHECKER: CSSProperties = {
  backgroundImage:
    'conic-gradient(#c8c8c8 25%, #ffffff 0 50%, #c8c8c8 0 75%, #ffffff 0)',
  backgroundSize: '10px 10px',
}

type EyeDropperCtor = new () => {open: () => Promise<{sRGBHex: string}>}

const EyedropperIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path
      d="M16.5 5.5l3 3m-1.5-4.5 3 3-2.5 2.5-3-3L18 4zM15.5 8.5l-8 8-1.5 4 4-1.5 8-8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** Tracks a pointer across an element, reporting its position as 0–1 fractions. */
function useTrack(onMove: (x: number, y: number) => void, onEnd: () => void) {
  const handle = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onMove(clamp((e.clientX - rect.left) / rect.width), clamp((e.clientY - rect.top) / rect.height))
  }
  return {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      handle(e)
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) handle(e)
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
        onEnd()
      }
    },
  }
}

const Thumb = ({style}: {style: CSSProperties}) => (
  <div
    style={{
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: '50%',
      border: '2px solid #fff',
      boxShadow: '0 0 0 1px rgba(0,0,0,.35), 0 1px 3px rgba(0,0,0,.4)',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      ...style,
    }}
  />
)

/**
 * Elementor-style color picker: a swatch that opens a popover with a
 * saturation/value square, hue and alpha sliders, and a HEXA / RGBA / HSLA
 * text field. Empty value means "not set"; `onChange('')` clears it.
 */
export function ColorPicker({
  value,
  onChange,
  fallback,
  placeholder,
  showInput = false,
}: {
  value?: string
  onChange: (value: string) => void
  /** Swatch shown while empty. Display only — never written. */
  fallback?: string
  placeholder?: string
  /** Also show an inline text field next to the swatch. */
  showInput?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ColorFormat>(() => detectFormat(value))
  const [hsva, setHsva] = useState<Hsva>(() => parseColor(value) ?? parseColor(fallback) ?? DEFAULT)
  const [text, setText] = useState(value ?? '')

  const dragging = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  // Follow outside changes (another editor, undo) unless the user is mid-drag.
  useEffect(() => {
    if (dragging.current) return
    setText(value ?? '')
    const parsed = parseColor(value)
    if (parsed) setHsva(parsed)
  }, [value])

  useEffect(() => () => clearTimeout(timer.current), [])

  useClickOutsideEvent(open ? () => setOpen(false) : undefined, () => [button, popover])
  useGlobalKeyDown((e) => {
    if (open && e.key === 'Escape') setOpen(false)
  })

  const emit = useCallback(
    (next: Hsva, nextFormat: ColorFormat = format, immediate = false) => {
      setHsva(next)
      const str = formatColor(next, nextFormat)
      setText(str)
      clearTimeout(timer.current)
      if (immediate) onChange(str)
      else timer.current = setTimeout(() => onChange(str), DEBOUNCE_MS)
    },
    [format, onChange],
  )

  const endDrag = () => {
    dragging.current = false
    clearTimeout(timer.current)
    onChange(formatColor(hsva, format))
  }

  const sv = useTrack((x, y) => {
    dragging.current = true
    emit({...hsva, s: x, v: 1 - y})
  }, endDrag)
  const hue = useTrack((x) => {
    dragging.current = true
    emit({...hsva, h: x * 360})
  }, endDrag)
  const alpha = useTrack((x) => {
    dragging.current = true
    emit({...hsva, a: Math.round(x * 100) / 100})
  }, endDrag)

  const commitText = (raw: string) => {
    if (raw.trim() === '') {
      clearTimeout(timer.current)
      onChange('')
      return
    }
    const parsed = parseColor(raw)
    if (parsed) emit(parsed, format, true)
    else setText(value ?? '')
  }

  const EyeDropper = (globalThis as {EyeDropper?: EyeDropperCtor}).EyeDropper
  const pickFromScreen = async () => {
    if (!EyeDropper) return
    try {
      const {sRGBHex} = await new EyeDropper().open()
      const parsed = parseColor(sRGBHex)
      if (parsed) emit({...parsed, a: hsva.a}, format, true)
    } catch {
      // Cancelled with Escape.
    }
  }

  const hasValue = Boolean(value)
  const swatchColor = hasValue ? value : fallback
  const opaqueHue = `hsl(${hsva.h}, 100%, 50%)`
  const solid = toCss({...hsva, a: 1})

  const panel = (
    <Card padding={3} radius={3} shadow={3} style={{width: 264}} ref={setPopover}>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            Color Picker
          </Text>
          <Flex gap={1}>
            <Button
              mode="bleed"
              padding={2}
              icon={ResetIcon}
              aria-label="Clear color"
              title="Clear"
              onClick={() => {
                clearTimeout(timer.current)
                setText('')
                onChange('')
              }}
            />
            {EyeDropper && (
              <Button
                mode="bleed"
                padding={2}
                aria-label="Pick a color from the screen"
                title="Eyedropper"
                onClick={pickFromScreen}
              >
                <EyedropperIcon />
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Saturation / value square, drawn at the current alpha like Elementor's. */}
        <div
          {...sv}
          style={{position: 'relative', height: 150, borderRadius: 4, cursor: 'crosshair', touchAction: 'none', ...CHECKER}}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              opacity: Math.max(hsva.a, 0.08),
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${opaqueHue}`,
            }}
          />
          <Thumb style={{left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: solid}} />
        </div>

        {/* Hue */}
        <div
          {...hue}
          style={{
            position: 'relative',
            height: 12,
            borderRadius: 6,
            cursor: 'pointer',
            touchAction: 'none',
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
        >
          <Thumb style={{left: `${(hsva.h / 360) * 100}%`, top: '50%', background: opaqueHue}} />
        </div>

        {/* Alpha */}
        <div
          {...alpha}
          style={{position: 'relative', height: 12, borderRadius: 6, cursor: 'pointer', touchAction: 'none', ...CHECKER}}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 6,
              background: `linear-gradient(to right, transparent, ${solid})`,
            }}
          />
          <Thumb style={{left: `${hsva.a * 100}%`, top: '50%', background: toCss(hsva)}} />
        </div>

        <Flex align="center" gap={2}>
          <input
            type="text"
            value={text}
            placeholder={placeholder ?? fallback ?? '#000000'}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText((e.target as HTMLInputElement).value)
            }}
            aria-label="Color value"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 8px',
              fontSize: 12,
              fontFamily: 'var(--font-family-mono, ui-monospace, monospace)',
              border: '1px solid var(--card-border-color)',
              borderRadius: 4,
              backgroundColor: 'var(--card-bg-color)',
              color: 'var(--card-fg-color)',
            }}
          />
          <Flex gap={1}>
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFormat(f.value)
                  if (hasValue) emit(hsva, f.value, true)
                }}
                aria-pressed={format === f.value}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '2px 3px',
                  fontSize: 11,
                  fontWeight: format === f.value ? 700 : 500,
                  color: format === f.value ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {f.label}
              </button>
            ))}
          </Flex>
        </Flex>
      </Stack>
    </Card>
  )

  return (
    <Flex align="center" gap={1} style={{flex: showInput ? 1 : undefined}}>
      <Popover open={open} content={panel} portal placement="bottom-end" constrainSize>
        <button
          ref={setButton}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={hasValue ? `Color ${value}. Edit` : 'Pick a color'}
          aria-expanded={open}
          style={{
            position: 'relative',
            width: 28,
            height: 28,
            padding: 0,
            borderRadius: 4,
            border: '1px solid var(--card-border-color)',
            cursor: 'pointer',
            overflow: 'hidden',
            flexShrink: 0,
            ...CHECKER,
          }}
        >
          {swatchColor ? (
            <span style={{position: 'absolute', inset: 0, background: swatchColor}} />
          ) : (
            // Empty: a slash, as Elementor shows for "no color".
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--card-bg-color)',
                backgroundImage:
                  'linear-gradient(to top right, transparent calc(50% - 1px), #e5484d calc(50% - 1px), #e5484d calc(50% + 1px), transparent calc(50% + 1px))',
              }}
            />
          )}
        </button>
      </Popover>

      {showInput && (
        <input
          type="text"
          value={text}
          placeholder={placeholder ?? fallback ?? '#000000'}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitText((e.target as HTMLInputElement).value)
          }}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 12,
            fontFamily: 'inherit',
            border: '1px solid var(--card-border-color)',
            borderRadius: 4,
            backgroundColor: 'var(--card-bg-color)',
            color: 'var(--card-fg-color)',
            minWidth: 0,
          }}
        />
      )}
    </Flex>
  )
}
