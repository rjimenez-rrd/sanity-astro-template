import {useState} from 'react'
import {type ObjectInputProps, set, unset} from 'sanity'
import {Button, Card, Flex, Text} from '@sanity/ui'
import {LinkIcon, UnlinkIcon} from '@sanity/icons'
import {ControlRow} from '../controls/controls'
import {CompactSelect} from '../controls/CompactSelect'

// Empty (the '—' placeholder) clears the corner
const RADIUS_OPTIONS = [
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
type Corner = (typeof CORNERS)[number]

export function BorderRadiusInput(props: ObjectInputProps) {
  const {onChange} = props
  const vals = (props.value ?? {}) as Partial<Record<Corner, string>>

  // Start linked unless the saved corners already differ
  const [linked, setLinked] = useState(
    () => new Set(CORNERS.map((c) => vals[c]).filter(Boolean)).size <= 1,
  )

  const hasValues = CORNERS.some((c) => vals[c])

  const patchFor = (corner: Corner, v: string) => (v === '' ? unset([corner]) : set(v, [corner]))
  const handleChange = (corner: Corner, v: string) =>
    onChange(linked ? CORNERS.map((c) => patchFor(c, v)) : patchFor(corner, v))

  const corner = (c: Corner) => (
    <CompactSelect
      value={vals[c]}
      options={RADIUS_OPTIONS}
      onChange={(v) => handleChange(c, v)}
      width={64}
    />
  )

  const [tl, tr, br, bl] = CORNERS.map((c) => vals[c] ?? '0')
  const previewRadius = linked ? tl : `${tl} ${tr} ${br} ${bl}`

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <ControlRow
        label="Border Radius"
        stacked
        aside={
          <Flex align="center" gap={1}>
            {hasValues && (
              <Button
                mode="bleed"
                fontSize={0}
                padding={2}
                text="Clear"
                onClick={() => onChange(CORNERS.map((c) => unset([c])))}
              />
            )}
            <Button
              icon={linked ? LinkIcon : UnlinkIcon}
              mode={linked ? 'default' : 'ghost'}
              tone={linked ? 'primary' : 'default'}
              fontSize={0}
              padding={2}
              aria-pressed={linked}
              title={linked ? 'Unlink corners (set individually)' : 'Link all corners'}
              onClick={() => setLinked(!linked)}
            />
          </Flex>
        }
      >
        {/* Corner pickers flank a live preview of the shape */}
        <Flex align="stretch" justify="center" gap={2}>
          <Flex direction="column" justify="space-between" gap={2}>
            {corner('topLeft')}
            {corner('bottomLeft')}
          </Flex>
          <Card
            flex={1}
            tone="primary"
            border
            style={{
              minHeight: 60,
              maxWidth: 120,
              borderRadius: previewRadius,
              transition: 'border-radius 0.2s ease',
            }}
          />
          <Flex direction="column" justify="space-between" gap={2}>
            {corner('topRight')}
            {corner('bottomRight')}
          </Flex>
        </Flex>
        {linked && (
          <Text size={0} muted align="center">
            All corners linked
          </Text>
        )}
      </ControlRow>
    </Card>
  )
}
