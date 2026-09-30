import {defineType, defineField, defineArrayMember} from 'sanity'
import {MenuIcon, ImageIcon} from '@sanity/icons'

export const tabbedContentType = defineType({
  name: 'tabbedContent',
  title: 'Tabbed Content',
  type: 'object',
  icon: MenuIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'Optional heading above the tabs.',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'content',
      description: 'Optional subtitle below the heading.',
    }),
    defineField({
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      group: 'content',
      description: 'Each tab has a label and its own content blocks.',
      validation: (rule) => rule.required().min(2).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tab',
          title: 'Tab',
          fields: [
            defineField({
              name: 'label',
              title: 'Tab Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              description: 'Optional icon shown next to the tab label.',
              options: {hotspot: false},
            }),
            defineField({
              name: 'content',
              title: 'Content',
              type: 'array',
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({type: 'blockContent'}),
                defineArrayMember({
                  type: 'object',
                  name: 'tabImage',
                  title: 'Image',
                  icon: ImageIcon,
                  fields: [
                    defineField({
                      name: 'image',
                      title: 'Image',
                      type: 'image',
                      options: {hotspot: true},
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'alt',
                      title: 'Alt Text',
                      type: 'string',
                    }),
                  ],
                  preview: {
                    select: {media: 'image', alt: 'alt'},
                    prepare({media, alt}: {media?: any; alt?: string}) {
                      return {title: alt || 'Image', media}
                    },
                  },
                }),
                defineArrayMember({type: 'callToAction'}),
                defineArrayMember({type: 'video'}),
                defineArrayMember({type: 'iconText'}),
                defineArrayMember({type: 'buttonGroup'}),
                defineArrayMember({type: 'statMetric'}),
                defineArrayMember({type: 'testimonialQuote'}),
                defineArrayMember({type: 'alertNotice'}),
                defineArrayMember({type: 'pricingCard'}),
                defineArrayMember({type: 'socialEmbed'}),
                defineArrayMember({type: 'logoRow'}),
                defineArrayMember({type: 'mapEmbed'}),
                defineArrayMember({type: 'codeBlock'}),
                defineArrayMember({type: 'dataTable'}),
                defineArrayMember({type: 'lottieAnimation'}),
              ],
              options: {
                insertMenu: {
                  views: [{name: 'grid'}],
                },
              },
            }),
          ],
          preview: {
            select: {label: 'label', content: 'content'},
            prepare({label, content}: {label?: string; content?: Array<unknown>}) {
              const blockCount = content?.length ?? 0
              return {
                title: label || 'Tab',
                subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'tabStyle',
      title: 'Tab Style',
      type: 'string',
      group: 'style',
      description: 'Visual style of the tab buttons.',
      initialValue: 'underline',
      options: {
        list: [
          {title: 'Underline', value: 'underline'},
          {title: 'Pills', value: 'pills'},
          {title: 'Boxed', value: 'boxed'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      group: 'style',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {title: 'title', tabs: 'tabs'},
    prepare({title, tabs}: {title?: string; tabs?: Array<unknown>}) {
      const tabCount = tabs?.length ?? 0
      return {
        title: title || 'Tabbed Content',
        subtitle: `${tabCount} tab${tabCount !== 1 ? 's' : ''}`,
        media: MenuIcon,
      }
    },
  },
})
