import {defineType, defineField} from 'sanity'
import {ColorWheelIcon, CogIcon, EyeOpenIcon, ImageIcon} from '@sanity/icons'
import {advancedField, styleEffectsField, visibilityField} from '../fields/container'
import {styleField} from '../fields/style'

export const imageBlockType = defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  // The same tabs as a Container, with Content in place of Layout. The site
  // renders Style, Advanced and Visibility through BlockRenderer.
  groups: [
    {name: 'content', title: 'Content', icon: ImageIcon, default: true},
    {name: 'style', title: 'Style', icon: ColorWheelIcon},
    {name: 'advanced', title: 'Advanced', icon: CogIcon},
    {name: 'visibility', title: 'Visibility', icon: EyeOpenIcon},
  ],
  fields: [
    defineField({
      name: 'image',
      group: 'content',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
      ],
    }),
    defineField({
      name: 'caption',
      group: 'content',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'priority',
      group: 'content',
      title: 'Load First',
      type: 'boolean',
      initialValue: false,
      description:
        'Turn on only when this image is visible without scrolling, e.g. at the top of the page. It loads right away instead of when scrolled to, so the page shows sooner. Leave off everywhere else.',
    }),
    // Border and Border Radius stay in Typography & Effects (saved in
    // blockStyles, where the image's corners already are); the Style panel
    // keeps background and overlay.
    styleField({hideBorder: true}), // Style: background, overlay
    styleEffectsField({keepBorder: true}), // Style: Typography & Effects, Border, Border Radius
    advancedField(), // Advanced: margin, padding, z-index, CSS ID/classes, Custom CSS, motion
    visibilityField(), // Visibility: hide per device
  ],
  preview: {
    select: {media: 'image', alt: 'image.alt', caption: 'caption'},
    prepare({media, alt, caption}) {
      return {title: caption || alt || 'Image', media}
    },
  },
})
