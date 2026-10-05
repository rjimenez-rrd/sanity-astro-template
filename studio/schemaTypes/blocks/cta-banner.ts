import {defineType, defineField} from 'sanity'
import {BlockContentIcon} from '@sanity/icons'

/**
 * The banners built into the site: their words (English and Spanish), photo
 * and button are written in the site's code, frontend/src/lib/banners.ts, so
 * nothing here needs filling in. Adding one: an entry there, and one here
 * with the same value.
 */
const BANNERS = [{title: 'We Have Your Back', value: 'we-have-your-back'}]

/**
 * CTA Banner: places one of the site's built-in banners — a heading, text and
 * a button over a photo fading into navy. Spanish pages show its Spanish
 * words. For a banner with a form in it, use Form CTA.
 */
export const ctaBannerType = defineType({
  name: 'ctaBanner',
  title: 'CTA Banner',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'banner',
      title: 'Banner',
      type: 'string',
      description: 'One of the banners built into the site. Its words, photo and button are set in the code, in English and Spanish.',
      options: {list: BANNERS, layout: 'radio'},
      initialValue: BANNERS[0].value,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {banner: 'banner'},
    prepare({banner}: {banner?: string}) {
      const title = BANNERS.find((b) => b.value === banner)?.title
      return {title: title || 'CTA Banner', subtitle: 'CTA Banner', media: BlockContentIcon}
    },
  },
})
