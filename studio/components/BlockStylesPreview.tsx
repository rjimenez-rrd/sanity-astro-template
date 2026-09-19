import {type ObjectInputProps} from 'sanity'
import {Card, Flex, Text, Stack, Box} from '@sanity/ui'

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.1)',
}

function obj(val: unknown): Record<string, unknown> {
  return typeof val === 'object' && val !== null ? (val as Record<string, unknown>) : {}
}

function str(val: unknown): string | undefined {
  return typeof val === 'string' && val ? val : undefined
}

export function BlockStylesPreview(props: ObjectInputProps) {
  const {renderDefault, value} = props
  const s = (value ?? {}) as Record<string, unknown>

  const padding = obj(s.padding)
  const margin = obj(s.margin)
  const border = obj(s.border)
  const radius = obj(s.borderRadius)
  const bg = obj(s.background)
  const typo = obj(s.typography)
  const fx = obj(s.effects)

  const hasAny =
    Object.values(padding).some(Boolean) ||
    Object.values(margin).some(Boolean) ||
    Object.values(border).some(Boolean) ||
    Object.values(radius).some(Boolean) ||
    Object.values(bg).some(Boolean) ||
    Object.values(typo).some(Boolean) ||
    Object.values(fx).some(Boolean)

  const borderRadiusStr =
    str(radius.topLeft) || str(radius.topRight) || str(radius.bottomRight) || str(radius.bottomLeft)
      ? `${radius.topLeft ?? '0'} ${radius.topRight ?? '0'} ${radius.bottomRight ?? '0'} ${radius.bottomLeft ?? '0'}`
      : '0'

  const previewStyles: React.CSSProperties = {
    backgroundColor: str(bg.color) ?? '#f8f9fa',
    color: str(typo.textColor) ?? '#333',
    fontSize: str(typo.fontSize) ? `${typo.fontSize}px` : '14px',
    textAlign: (str(typo.textAlign) as React.CSSProperties['textAlign']) ?? 'left',
    borderRadius: borderRadiusStr,
    borderWidth: str(border.width) ?? '0',
    borderColor: str(border.color) ?? 'transparent',
    borderStyle: (str(border.style) ?? 'solid') as React.CSSProperties['borderStyle'],
    boxShadow: str(fx.shadow) ? SHADOW_MAP[fx.shadow as string] ?? 'none' : 'none',
    opacity: typeof fx.opacity === 'number' ? (fx.opacity as number) / 100 : 1,
    overflow: (str(fx.overflow) as React.CSSProperties['overflow']) ?? 'visible',
    paddingTop: str(padding.top),
    paddingBottom: str(padding.bottom),
    paddingLeft: str(padding.left),
    paddingRight: str(padding.right),
    minHeight: 48,
    transition: 'all 0.2s ease',
  }

  const tags: string[] = []
  if (borderRadiusStr !== '0') tags.push('radius')
  if (border.width && border.width !== '0') tags.push('border')
  if (bg.color) tags.push('bg')
  if (typo.textColor) tags.push('color')
  if (fx.shadow && fx.shadow !== 'none') tags.push('shadow')
  if (typeof fx.opacity === 'number' && (fx.opacity as number) < 100) tags.push('opacity')
  if (bg.image) tags.push('bg image')
  const basePaddingKeys = ['top', 'right', 'bottom', 'left']
  const responsivePaddingKeys = [
    'topTablet', 'rightTablet', 'bottomTablet', 'leftTablet',
    'topMobile', 'rightMobile', 'bottomMobile', 'leftMobile',
  ]
  const hasBasePadding = basePaddingKeys.some((k) => Boolean(padding[k]))
  const hasResponsivePadding = responsivePaddingKeys.some((k) => Boolean(padding[k]))
  const hasBaseMargin = basePaddingKeys.some((k) => Boolean(margin[k]))
  const hasResponsiveMargin = responsivePaddingKeys.some((k) => Boolean(margin[k]))
  if (hasBasePadding || hasResponsivePadding) tags.push(hasResponsivePadding ? 'padding (responsive)' : 'padding')
  if (hasBaseMargin || hasResponsiveMargin) tags.push(hasResponsiveMargin ? 'margin (responsive)' : 'margin')

  return (
    <Stack space={3}>
      {hasAny && (
        <Card padding={2} radius={2} tone="transparent" border>
          <Stack space={2}>
            <Flex align="center" justify="space-between" paddingX={1}>
              <Text size={0} weight="bold" muted>
                Live Preview
              </Text>
              {tags.length > 0 && (
                <Text size={0} muted>
                  {tags.join(' · ')}
                </Text>
              )}
            </Flex>
            <Box style={{padding: 8, backgroundColor: '#fff', borderRadius: 4}}>
              <div style={previewStyles}>
                <Flex align="center" justify="center" style={{minHeight: 48}}>
                  <Text size={1} style={{color: previewStyles.color}}>
                    Sample content
                  </Text>
                </Flex>
              </div>
            </Box>
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  )
}
