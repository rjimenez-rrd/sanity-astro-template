import {defineType, defineArrayMember, defineField, type PreviewValue} from 'sanity'
import {RichTextInput} from '../../components/inputs/RichTextInput'

export const blockContentType = defineType({
  name: 'blockContent',
  // Pasting over a styled paragraph or heading keeps its style.
  components: {input: RichTextInput},
  title: 'Rich Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Paragraph', value: 'paragraph'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Number', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strikethrough', value: 'strike-through'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                title: 'URL',
                description:
                  'A page on this site as a path (/about-us, /es/sobre-nosotros), or a full address (https://…, mailto:, tel:).',
                // allowRelative: paths on this site, including Spanish /es/… ones.
                validation: (rule) =>
                  rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel'],
                    allowRelative: true,
                  }),
              }),
              defineField({
                name: 'openInNewTab',
                type: 'boolean',
                title: 'Open in new tab',
                initialValue: false,
              }),
            ],
          },
        ],
      },
      // Inline, mid-sentence: Site Settings values such as the phone.
      of: [defineArrayMember({type: 'siteInfo'})],
    }),
    // Blocks embedded mid-article. Each one also needs an adapter in
    // frontend components/portable-text/ and an entry in PortableTextRenderer's
    // `type` map, or it saves here and renders as nothing.
    defineArrayMember({type: 'callToAction'}),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        }),
      ],
      // Without this an inline image shows as an empty "Untitled" box in the
      // editor, with no indication of which image it is.
      preview: {
        select: {media: 'asset', alt: 'alt'},
        prepare({media, alt}: {media?: PreviewValue['media']; alt?: string}) {
          return {title: alt?.trim() || 'Image', subtitle: 'Inline image', media}
        },
      },
    }),
  ],
})
