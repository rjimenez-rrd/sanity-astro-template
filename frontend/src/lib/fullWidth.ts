import {stegaClean} from '@sanity/client/stega'
import {DEVICES} from './cssValues'

/**
 * The devices a Button's Full Width is on (studio call-to-action.ts). Buttons
 * saved before it was per device have the old on/off `fullWidth` instead:
 * on means every device, until Full Width is set.
 */
export function fullWidthDevices(block: unknown): string[] {
  const {fullWidthOn, fullWidth} = (block ?? {}) as {fullWidthOn?: string[] | null; fullWidth?: boolean | null}
  if (fullWidthOn) return stegaClean(fullWidthOn)
  return fullWidth === true ? [...DEVICES] : []
}
