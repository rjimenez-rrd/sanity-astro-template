import {defineType, defineField} from 'sanity'
import {CodeBlockIcon} from '@sanity/icons'

/**
 * Raw markup, rendered exactly as written.
 *
 * Rich Text stores structured Portable Text, so anything outside its styles and
 * marks would be dropped on save. This block is the escape hatch for embeds,
 * third-party widgets and hand-written markup — the same split Elementor makes
 * between its Text Editor and HTML widgets.
 */
export const htmlBlockType = defineType({
  name: 'htmlBlock',
  title: 'Custom HTML',
  type: 'object',
  icon: CodeBlockIcon,
  fields: [
    defineField({
      name: 'html',
      title: 'HTML',
      type: 'text',
      rows: 12,
      description:
        'Rendered as written, without escaping. Only paste markup you trust — a <script> tag here will run on the page.',
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
    select: {html: 'html'},
    prepare({html}: {html?: string}) {
      const firstTag = html?.trim().match(/^<\s*([a-zA-Z][\w-]*)/)?.[1]
      const lines = html?.trim().split('\n').length ?? 0
      return {
        title: 'Custom HTML',
        subtitle: firstTag
          ? `<${firstTag}> · ${lines} line${lines !== 1 ? 's' : ''}`
          : 'Empty',
      }
    },
  },
})
