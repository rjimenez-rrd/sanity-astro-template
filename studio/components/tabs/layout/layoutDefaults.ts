/**
 * Starting settings for a new container. Used as the schema's initialValue
 * and when an older row or column gets its first container setting, so both
 * paths start from the same place.
 */
export const ROW_CONTAINER_DEFAULTS = {
  layoutType: 'flex',
  contentWidth: 'full',
  // Side by side, stacked on mobile — what the old grid presets did.
  direction: {desktop: 'row', mobile: 'column'},
  gap: {
    linked: true,
    desktop: {column: 24, row: 24, unit: 'px'},
    mobile: {column: 16, row: 16, unit: 'px'},
  },
}

export const COLUMN_CONTAINER_DEFAULTS = {
  layoutType: 'flex',
  direction: {desktop: 'column'},
}
