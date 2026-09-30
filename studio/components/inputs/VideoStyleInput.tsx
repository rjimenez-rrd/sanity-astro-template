import {useState} from 'react'
import {set, setIfMissing, unset, type ObjectInputProps} from 'sanity'
import {Box, Card, Stack} from '@sanity/ui'
import {ControlRow, SectionHeader} from '../controls/controls'
import {CssFilters, type CssFilterValues} from '../controls/CssFilters'
import {Dropdown} from '../tabs/style/shared'

type VideoStyle = {aspectRatio?: string; cssFilters?: CssFilterValues}

// Keep in step with ASPECT_RATIOS in schemaTypes/blocks/video.ts.
const RATIOS: [string, string][] = ['16:9', '21:9', '4:3', '3:2', '1:1', '9:16'].map((r) => [r, r])

/** Video -> Style tab, as in Elementor: a "Video" section with Aspect Ratio and CSS Filters. */
export function VideoStyleInput(props: ObjectInputProps) {
  const {onChange} = props
  const value = (props.value ?? {}) as VideoStyle
  const [open, setOpen] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const setFilter = (key: string, next: number | undefined) =>
    onChange(
      next === undefined
        ? unset(['cssFilters', key])
        : [setIfMissing({}), setIfMissing({}, ['cssFilters']), set(next, ['cssFilters', key])],
    )

  return (
    <Card borderBottom>
      <SectionHeader title="Video" open={open} onToggle={() => setOpen(!open)} />
      {open && (
        <Box paddingX={3} paddingBottom={4} paddingTop={1}>
          <Stack space={4}>
            <ControlRow label="Aspect Ratio">
              <Dropdown
                value={value.aspectRatio}
                options={RATIOS}
                placeholder="16:9"
                onChange={(next) =>
                  onChange(next ? [setIfMissing({}), set(next, ['aspectRatio'])] : unset(['aspectRatio']))
                }
              />
            </ControlRow>
            <CssFilters
              value={value.cssFilters}
              open={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
              onChange={setFilter}
            />
          </Stack>
        </Box>
      )}
    </Card>
  )
}
