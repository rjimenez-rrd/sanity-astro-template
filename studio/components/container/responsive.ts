/**
 * Elementor-style responsive values: desktop is the base, tablet and mobile
 * override it. Unset devices inherit from the next larger one.
 */
export const DEVICES = ['desktop', 'tablet', 'mobile'] as const

export type Device = (typeof DEVICES)[number]

export type Responsive<T> = Partial<Record<Device, T>>

export const DEVICE_LABELS: Record<Device, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

const FALLBACK_CHAIN: Record<Device, Device[]> = {
  desktop: ['desktop'],
  tablet: ['tablet', 'desktop'],
  mobile: ['mobile', 'tablet', 'desktop'],
}

/** The value in effect on `device`, and whether it was inherited. */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined,
  device: Device,
): {value: T | undefined; inherited: boolean} {
  for (const d of FALLBACK_CHAIN[device]) {
    const v = value?.[d]
    if (v !== undefined && v !== null && v !== '') {
      return {value: v, inherited: d !== device}
    }
  }
  return {value: undefined, inherited: false}
}
