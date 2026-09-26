import {defineType, defineField} from 'sanity'
import {MobileDeviceIcon} from '@sanity/icons'
import {SiteInfoPreview} from '../../components/previews/SiteInfoPreview'

/** Site Settings values an editor can drop into rich text. */
export const SITE_INFO_KEYS = [
  {title: 'Phone, as displayed, e.g. (833) SANDERS', value: 'phone'},
  {title: 'Phone number, e.g. (516) 591-3208', value: 'phoneNumber'},
]

/**
 * A Site Settings value placed inline in rich text, mid-sentence like a word.
 * It stores only which value, never the value itself, so changing it in Site
 * Settings updates every page. Rendered by frontend PtSiteInfo.astro.
 */
export const siteInfoType = defineType({
  name: 'siteInfo',
  title: 'Phone',
  type: 'object',
  icon: MobileDeviceIcon,
  fields: [
    defineField({
      name: 'key',
      title: 'Show',
      type: 'string',
      options: {list: SITE_INFO_KEYS, layout: 'radio'},
      initialValue: 'phone',
      validation: (rule) => rule.required(),
      description: 'Filled in from Site Settings → Branding, so it stays the same everywhere. Both dial the Phone Number.',
    }),
  ],
  // The key rides along as the title; SiteInfoPreview swaps in the value.
  preview: {select: {title: 'key'}},
  components: {preview: SiteInfoPreview},
})
