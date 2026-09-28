export const SPACING_OPTIONS = [
  {title: '0', value: '0'},
  {title: '4px', value: '4px'},
  {title: '8px', value: '8px'},
  {title: '12px', value: '12px'},
  {title: '16px', value: '16px'},
  {title: '20px', value: '20px'},
  {title: '24px', value: '24px'},
  {title: '32px', value: '32px'},
  {title: '40px', value: '40px'},
  {title: '48px', value: '48px'},
  {title: '56px', value: '56px'},
  {title: '64px', value: '64px'},
  {title: '80px', value: '80px'},
  {title: '96px', value: '96px'},
  {title: '128px', value: '128px'},
] as const

export const singletonTypes = new Set(['siteSettings', 'siteSettingsEs', 'homePage'])

export const singletonActions = new Set(['publish', 'discardChanges', 'restore'])
