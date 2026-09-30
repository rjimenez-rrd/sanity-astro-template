import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Card, Flex, Text, Button} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'

const RADIUS_OPTIONS = [
  {title: '—', value: ''},
  {title: '0', value: '0'},
  {title: '2px', value: '2px'},
  {title: '4px', value: '4px'},
  {title: '8px', value: '8px'},
  {title: '12px', value: '12px'},
  {title: '16px', value: '16px'},
  {title: '24px', value: '24px'},
  {title: 'Round', value: '9999px'},
]

const CORNERS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const

function RadiusSelect({
  value,
  onChange,
}: {
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 56,
        padding: '3px 2px',
        fontSize: 11,
        fontFamily: 'inherit',
        border: '1px solid var(--card-border-color)',
        borderRadius: 4,
        backgroundColor: 'var(--card-bg-color)',
        color: 'var(--card-fg-color)',
        textAlign: 'center',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
      }}
    >
      {RADIUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.title}
        </option>
      ))}
    </select>
  )
}

export function BorderRadiusInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const vals = (value ?? {}) as Record<string, string | undefined>

  const [linked, setLinked] = useState(() => {
    const values = CORNERS.map((c) => vals[c]).filter(Boolean)
    return values.length === 0 || new Set(values).size <= 1
  })

  const hasValues = CORNERS.some((c) => vals[c])

  const handleClear = useCallback(() => {
    onChange(CORNERS.map((c) => unset([c])))
  }, [onChange])

  const handleChange = useCallback(
    (corner: string, newValue: string) => {
      if (linked) {
        const patches = CORNERS.map((c) =>
          newValue === '' ? unset([c]) : set(newValue, [c]),
        )
        onChange(patches)
      } else {
        onChange(newValue === '' ? unset([corner]) : set(newValue, [corner]))
      }
    },
    [onChange, linked],
  )

  const tl = vals.topLeft ?? '0'
  const tr = vals.topRight ?? '0'
  const br = vals.bottomRight ?? '0'
  const bl = vals.bottomLeft ?? '0'

  const previewRadius = linked ? tl : `${tl} ${tr} ${br} ${bl}`

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Flex direction="column" gap={3}>
        <Flex align="center" justify="space-between">
          <Text size={0} weight="bold" muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10}}>
            Border Radius
          </Text>
          <Flex align="center" gap={1}>
            {hasValues && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--card-muted-fg-color)',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Clear
              </button>
            )}
          <Button
            icon={LinkIcon}
            mode="ghost"
            fontSize={0}
            padding={2}
            tone={linked ? 'primary' : 'default'}
            onClick={() => setLinked(!linked)}
            title={linked ? 'Unlink corners (set individually)' : 'Link all corners'}
            style={{opacity: linked ? 1 : 0.5}}
          />
          </Flex>
        </Flex>

        {/* Visual preview with corner inputs */}
        <div style={{position: 'relative', width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', width: 200, height: 100}}>
            {/* Preview shape */}
            <div
              style={{
                position: 'absolute',
                inset: 20,
                border: '2px solid var(--card-badge-primary-bg-color)',
                borderRadius: previewRadius,
                backgroundColor: 'rgba(66, 133, 244, 0.08)',
                transition: 'border-radius 0.2s ease',
              }}
            />

            {/* Top Left */}
            <div style={{position: 'absolute', top: 0, left: 0}}>
              <RadiusSelect
                value={vals.topLeft}
                onChange={(v) => handleChange('topLeft', v)}
              />
            </div>

            {/* Top Right */}
            <div style={{position: 'absolute', top: 0, right: 0}}>
              <RadiusSelect
                value={vals.topRight}
                onChange={(v) => handleChange('topRight', v)}
              />
            </div>

            {/* Bottom Left */}
            <div style={{position: 'absolute', bottom: 0, left: 0}}>
              <RadiusSelect
                value={vals.bottomLeft}
                onChange={(v) => handleChange('bottomLeft', v)}
              />
            </div>

            {/* Bottom Right */}
            <div style={{position: 'absolute', bottom: 0, right: 0}}>
              <RadiusSelect
                value={vals.bottomRight}
                onChange={(v) => handleChange('bottomRight', v)}
              />
            </div>
          </div>
        </div>

        {linked && (
          <Text size={0} muted align="center">
            All corners linked
          </Text>
        )}
      </Flex>
    </Card>
  )
}
