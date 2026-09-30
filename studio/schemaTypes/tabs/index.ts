import {CogIcon, ColorWheelIcon, EyeOpenIcon, ThLargeIcon} from '@sanity/icons'

/*
 * The tabs a block's settings are split into, as in Elementor: one file per
 * tab here, and the inputs that draw them in components/tabs/<tab>/.
 */
export {layoutField} from './layout'
export {styleField, styleEffectsField} from './style'
export {advancedField} from './advanced'
export {motionField} from './motion'
export {visibilityField} from './visibility'

/**
 * Elementor-style editing for containers: the same four tabs and the same
 * fields on page rows and on the columns inside them.
 */
export const CONTAINER_TABS = [
  {name: 'layout', title: 'Layout', icon: ThLargeIcon, default: true},
  {name: 'style', title: 'Style', icon: ColorWheelIcon},
  {name: 'advanced', title: 'Advanced', icon: CogIcon},
  {name: 'visibility', title: 'Visibility', icon: EyeOpenIcon},
]
