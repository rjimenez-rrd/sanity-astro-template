import {useCallback, useState} from 'react'
import {type FormPatch, type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {Box, Card, Flex, Select, Stack, Text} from '@sanity/ui'
import {ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon} from '@sanity/icons'
import {
  ControlRow,
  GapsInput,
  IconToggleGroup,
  SectionHeader,
  SliderInput,
  UnitSelect,
  type IconOption,
} from '../../controls/controls'
import {
  AlignCenterIcon,
  AlignEndIcon,
  AlignStartIcon,
  AlignStretchIcon,
  JustifyAroundIcon,
  JustifyBetweenIcon,
  JustifyCenterIcon,
  JustifyEndIcon,
  JustifyEvenlyIcon,
  JustifyStartIcon,
  NoWrapIcon,
  WrapIcon,
} from '../../controls/icons'
import {resolveResponsive, type Device, type Responsive} from '../../controls/responsive'
import {COLUMN_CONTAINER_DEFAULTS, ROW_CONTAINER_DEFAULTS} from './layoutDefaults'

type Size = {size?: number; unit?: string}
type Gap = {column?: number; row?: number; unit?: string}

export type ContainerValue = {
  layoutType?: 'flex' | 'grid'
  overflow?: 'hidden' | 'auto'
  htmlTag?: string
  contentWidth?: 'boxed' | 'full'
  width?: Responsive<Size>
  minHeight?: Responsive<Size>
  gridColumns?: Responsive<number>
  direction?: Responsive<string>
  justifyContent?: Responsive<string>
  alignItems?: Responsive<string>
  justifyItems?: Responsive<string>
  gap?: Responsive<Gap> & {linked?: boolean}
  wrap?: Responsive<string>
}

/** 'row' is a page section; 'column' is a container nested inside one. */
export type ContainerVariant = 'row' | 'column'

const WIDTH_UNITS = ['px', '%', 'vw'] as const
const HEIGHT_UNITS = ['px', 'vh'] as const
const GAP_UNITS = ['px', 'em', 'rem', '%'] as const

/**
 * Placeholder for the Width field on a Boxed container. This is display only —
 * the width that actually renders is BOXED_DEFAULT_WIDTH in
 * frontend/src/lib/container.ts, so the two must stay equal.
 */
const BOXED_DEFAULT_WIDTH = 1360

const MAX_BY_UNIT: Record<string, number> = {px: 1600, '%': 100, vw: 100, vh: 100, em: 10, rem: 10}

const DIRECTIONS: IconOption[] = [
  {value: 'row', title: 'Row - horizontal', icon: <ArrowRightIcon />},
  {value: 'column', title: 'Column - vertical', icon: <ArrowDownIcon />},
  {value: 'row-reverse', title: 'Row - reversed', icon: <ArrowLeftIcon />},
  {value: 'column-reverse', title: 'Column - reversed', icon: <ArrowUpIcon />},
]

/** Rotate the icons so they read along the current main axis, as Elementor does. */
function axisTransform(direction: string, axis: 'main' | 'cross'): string | undefined {
  if (axis === 'main') {
    if (direction === 'row-reverse') return 'scaleX(-1)'
    if (direction === 'column') return 'rotate(90deg)'
    if (direction === 'column-reverse') return 'rotate(-90deg)'
    return undefined
  }
  return direction.startsWith('column') ? 'rotate(-90deg)' : undefined
}

function justifyOptions(direction: string): IconOption[] {
  const style = {transform: axisTransform(direction, 'main')}
  return [
    {value: 'flex-start', title: 'Start', icon: <JustifyStartIcon style={style} />},
    {value: 'center', title: 'Center', icon: <JustifyCenterIcon style={style} />},
    {value: 'flex-end', title: 'End', icon: <JustifyEndIcon style={style} />},
    {value: 'space-between', title: 'Space Between', icon: <JustifyBetweenIcon style={style} />},
    {value: 'space-around', title: 'Space Around', icon: <JustifyAroundIcon style={style} />},
    {value: 'space-evenly', title: 'Space Evenly', icon: <JustifyEvenlyIcon style={style} />},
  ]
}

function alignOptions(transform: string | undefined): IconOption[] {
  const style = {transform}
  return [
    {value: 'flex-start', title: 'Start', icon: <AlignStartIcon style={style} />},
    {value: 'center', title: 'Center', icon: <AlignCenterIcon style={style} />},
    {value: 'flex-end', title: 'End', icon: <AlignEndIcon style={style} />},
    {value: 'stretch', title: 'Stretch', icon: <AlignStretchIcon style={style} />},
  ]
}

const WRAPS: IconOption[] = [
  {value: 'nowrap', title: 'No Wrap', icon: <NoWrapIcon />},
  {value: 'wrap', title: 'Wrap', icon: <WrapIcon />},
]

export function LayoutInput(props: ObjectInputProps) {
  const {onChange, value, schemaType} = props
  const options = schemaType.options as {variant?: ContainerVariant; item?: boolean} | undefined
  const variant: ContainerVariant = options?.variant ?? 'row'
  // An inner Column: Width sizes it inside its parent column, like a column's
  // does in its row, so it is always shown and there is no Content Width.
  const isItem = options?.item === true
  const sizesAsItem = variant === 'column' || isItem

  const v = (value ?? {}) as ContainerValue


  const [device, setDevice] = useState<Device>('desktop')
  const [open, setOpen] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const responsive = {device, onDevice: setDevice}

  /**
   * Writes one leaf, creating any missing parent objects on the way. The first
   * edit on an older row or column seeds the same defaults a new one gets, so
   * converting doesn't silently drop mobile stacking and gaps.
   */
  const patch = useCallback(
    (path: string[], next: unknown) => {
      const seed = variant === 'row' ? ROW_CONTAINER_DEFAULTS : COLUMN_CONTAINER_DEFAULTS
      const ops: FormPatch[] = [setIfMissing(structuredClone(seed))]
      for (let i = 1; i < path.length; i++) ops.push(setIfMissing({}, path.slice(0, i)))
      ops.push(next === undefined || next === '' ? unset(path) : set(next, path))
      onChange(ops)
    },
    [onChange, variant],
  )

  const layoutType = v.layoutType ?? 'flex'
  const isFlex = layoutType === 'flex'
  const contentWidth = v.contentWidth ?? 'full'

  // Unset direction falls back to what the renderer uses for this variant.
  const defaultDirection = variant === 'column' ? 'column' : 'row'
  const dir = resolveResponsive(v.direction, device)
  const direction = dir.value ?? defaultDirection
  const directionInherited = dir.value === undefined || dir.inherited

  const pick = <T,>(r: Responsive<T> | undefined) => resolveResponsive(r, device)

  const width = pick(v.width)
  const widthUnit = v.width?.[device]?.unit ?? width.value?.unit ?? (sizesAsItem ? '%' : 'px')
  const minHeight = pick(v.minHeight)
  const minHeightUnit = v.minHeight?.[device]?.unit ?? minHeight.value?.unit ?? 'px'
  const gap = pick(v.gap as Responsive<Gap> | undefined)
  const gapUnit = v.gap?.[device]?.unit ?? gap.value?.unit ?? 'px'
  const gridColumns = pick(v.gridColumns)
  const justify = pick(v.justifyContent)
  const align = pick(v.alignItems)
  const justifyItems = pick(v.justifyItems)
  const wrap = pick(v.wrap)

  const own = <T,>(r: Responsive<T> | undefined) => r?.[device]

  return (
    <Stack space={3}>
    <Card border radius={2}>
      <SectionHeader title="Container" open={open} onToggle={() => setOpen((o) => !o)} />

      {open && (
        <Box paddingX={3} paddingBottom={4} paddingTop={2}>
          <Stack space={4}>
            <ControlRow label="Container Layout">
              <Select
                fontSize={1}
                padding={2}
                value={layoutType}
                onChange={(e) => patch(['layoutType'], e.currentTarget.value)}
              >
                <option value="flex">Flexbox</option>
                <option value="grid">Grid</option>
              </Select>
            </ControlRow>

            {variant === 'row' && !isItem && (
              <ControlRow label="Content Width">
                <Select
                  fontSize={1}
                  padding={2}
                  value={contentWidth}
                  onChange={(e) => patch(['contentWidth'], e.currentTarget.value)}
                >
                  <option value="boxed">Boxed</option>
                  <option value="full">Full Width</option>
                </Select>
              </ControlRow>
            )}

            {(sizesAsItem || contentWidth === 'boxed') && (
              <ControlRow
                label="Width"
                responsive={responsive}
                stacked
                aside={
                  <UnitSelect
                    unit={widthUnit}
                    units={WIDTH_UNITS}
                    onChange={(u) => patch(['width', device, 'unit'], u)}
                  />
                }
                hint={
                  variant === 'column'
                    ? 'How wide this column is inside its row. Leave empty to share the remaining space.'
                    : isItem
                      ? 'How wide this column is inside its parent. Leave empty to size to its content; 100% takes a line of its own.'
                      : undefined
                }
              >
                <SliderInput
                  size={own(v.width)?.size}
                  placeholder={
                    width.inherited
                      ? width.value?.size
                      : variant === 'row' && !isItem && !width.value
                        ? BOXED_DEFAULT_WIDTH
                        : undefined
                  }
                  max={MAX_BY_UNIT[widthUnit] ?? 100}
                  onChange={(n) => {
                    // 0 is a real width; emptying the number box clears it.
                    if (n === undefined) return patch(['width', device], undefined)
                    patch(['width', device, 'size'], n)
                    if (!own(v.width)?.unit) patch(['width', device, 'unit'], widthUnit)
                  }}
                />
              </ControlRow>
            )}

            <ControlRow
              label="Min Height"
              responsive={responsive}
              stacked
              aside={
                <UnitSelect
                  unit={minHeightUnit}
                  units={HEIGHT_UNITS}
                  onChange={(u) => patch(['minHeight', device, 'unit'], u)}
                />
              }
              hint="To achieve full height Container use 100vh."
            >
              <SliderInput
                size={own(v.minHeight)?.size}
                placeholder={minHeight.inherited ? minHeight.value?.size : undefined}
                max={minHeightUnit === 'vh' ? 100 : 1440}
                onChange={(n) => {
                  if (n === undefined || n <= 0) return patch(['minHeight', device], undefined)
                  patch(['minHeight', device, 'size'], n)
                  if (!own(v.minHeight)?.unit) patch(['minHeight', device, 'unit'], minHeightUnit)
                }}
              />
            </ControlRow>

            <Box style={{borderTop: '1px solid var(--card-border-color)'}} />

            <Text size={1} weight="semibold">
              Items
            </Text>

            {isFlex ? (
              <>
                <ControlRow label="Direction" responsive={responsive}>
                  <IconToggleGroup
                    options={DIRECTIONS}
                    value={direction}
                    inherited={directionInherited}
                    onChange={(next) => patch(['direction', device], next)}
                  />
                </ControlRow>

                <ControlRow label="Justify Content" responsive={responsive} stacked>
                  <IconToggleGroup
                    fill
                    options={justifyOptions(direction)}
                    value={justify.value}
                    inherited={justify.inherited}
                    onChange={(next) => patch(['justifyContent', device], next)}
                  />
                </ControlRow>

                <ControlRow label="Align Items" responsive={responsive}>
                  <IconToggleGroup
                    options={alignOptions(axisTransform(direction, 'cross'))}
                    value={align.value}
                    inherited={align.inherited}
                    onChange={(next) => patch(['alignItems', device], next)}
                  />
                </ControlRow>
              </>
            ) : (
              <>
                {variant === 'column' && (
                  <ControlRow label="Columns" responsive={responsive} stacked>
                    <SliderInput
                      size={own(v.gridColumns)}
                      placeholder={gridColumns.inherited ? gridColumns.value : undefined}
                      min={1}
                      max={12}
                      onChange={(n) => patch(['gridColumns', device], n)}
                    />
                  </ControlRow>
                )}

                <ControlRow label="Justify Items" responsive={responsive}>
                  <IconToggleGroup
                    options={alignOptions('rotate(-90deg)')}
                    value={justifyItems.value}
                    inherited={justifyItems.inherited}
                    onChange={(next) => patch(['justifyItems', device], next)}
                  />
                </ControlRow>

                <ControlRow label="Align Items" responsive={responsive}>
                  <IconToggleGroup
                    options={alignOptions(undefined)}
                    value={align.value}
                    inherited={align.inherited}
                    onChange={(next) => patch(['alignItems', device], next)}
                  />
                </ControlRow>
              </>
            )}

            <ControlRow
              label="Gaps"
              responsive={responsive}
              stacked
              aside={
                <UnitSelect
                  unit={gapUnit}
                  units={GAP_UNITS}
                  onChange={(u) => patch(['gap', device, 'unit'], u)}
                />
              }
            >
              <GapsInput
                column={own(v.gap as Responsive<Gap>)?.column}
                row={own(v.gap as Responsive<Gap>)?.row}
                placeholder={gap.inherited ? gap.value : undefined}
                linked={v.gap?.linked ?? true}
                onLinkedChange={(linked) => patch(['gap', 'linked'], linked)}
                onChange={({column, row}) => {
                  if (column === undefined && row === undefined) {
                    return patch(['gap', device], undefined)
                  }
                  patch(['gap', device, 'column'], column)
                  patch(['gap', device, 'row'], row)
                  if (!own(v.gap as Responsive<Gap>)?.unit) patch(['gap', device, 'unit'], gapUnit)
                }}
              />
            </ControlRow>

            {isFlex && (
              <ControlRow
                label="Wrap"
                responsive={responsive}
                hint="Items within the container can stay in a single line (No wrap), or break into multiple lines (Wrap)."
              >
                <IconToggleGroup
                  options={WRAPS}
                  value={wrap.value}
                  inherited={wrap.inherited}
                  onChange={(next) => patch(['wrap', device], next)}
                />
              </ControlRow>
            )}

            {device !== 'desktop' && (
              <Flex>
                <Text size={0} muted>
                  Editing {device} values. Empty fields and faded buttons inherit from{' '}
                  {device === 'mobile' ? 'tablet / desktop' : 'desktop'}.
                </Text>
              </Flex>
            )}
          </Stack>
        </Box>
      )}
    </Card>

    {/* Elementor's Additional Options: what happens to content past the
        edges, and which HTML element the container renders as. */}
    <Card border radius={2}>
      <SectionHeader title="Additional Options" open={moreOpen} onToggle={() => setMoreOpen((o) => !o)} />
      {moreOpen && (
        <Box paddingX={3} paddingBottom={4} paddingTop={2}>
          <Stack space={4}>
            <ControlRow label="Overflow">
              <Select
                fontSize={1}
                padding={2}
                value={v.overflow ?? ''}
                onChange={(e) => patch(['overflow'], e.currentTarget.value)}
              >
                <option value="">Default</option>
                <option value="hidden">Hidden</option>
                <option value="auto">Auto</option>
              </Select>
            </ControlRow>
            <ControlRow
              label="HTML Tag"
              hint="The element it renders as. Section, header, footer and so on help screen readers and search engines; it looks the same."
            >
              <Select
                fontSize={1}
                padding={2}
                value={v.htmlTag ?? ''}
                onChange={(e) => patch(['htmlTag'], e.currentTarget.value)}
              >
                <option value="">Default ({variant === 'row' && !isItem ? 'section' : 'div'})</option>
                {['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav'].map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </Select>
            </ControlRow>
          </Stack>
        </Box>
      )}
    </Card>
    </Stack>
  )
}
