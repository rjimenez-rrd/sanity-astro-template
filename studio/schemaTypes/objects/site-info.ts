import {defineType, defineField} from 'sanity'
import {MobileDeviceIcon} from '@sanity/icons'
import {SiteInfoPreview} from '../../components/previews/SiteInfoPreview'
import {PhoneTextInput} from '../../components/inputs/PhoneTextInput'

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
      // Which wording of the phone: 'main', 'number' or a More Phone Texts
      // _key. Older saves say 'phone' (main) or 'phoneNumber' (number).
      initialValue: 'main',
      components: {input: PhoneTextInput},
      validation: (rule) => rule.required(),
      description: 'Which wording, from Site Settings → Branding, so it stays the same everywhere. Every one dials the Phone Number.',
    }),
  ],
  // The key rides along as the title; SiteInfoPreview swaps in the value.
  preview: {select: {title: 'key'}},
  components: {preview: SiteInfoPreview},
})
