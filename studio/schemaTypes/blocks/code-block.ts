import {defineType, defineField} from 'sanity'
import {CodeIcon} from '@sanity/icons'
import {CodeBlockPreview} from '../../components/previews/CodeBlockPreview'

export const codeBlockType = defineType({
  name: 'codeBlock',
  title: 'Code Block',
  type: 'object',
  icon: CodeIcon,
  components: {
    input: CodeBlockPreview,
  },
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'javascript',
      options: {
        list: [
          {title: 'JavaScript', value: 'javascript'},
          {title: 'TypeScript', value: 'typescript'},
          {title: 'Python', value: 'python'},
          {title: 'HTML', value: 'html'},
          {title: 'CSS', value: 'css'},
          {title: 'JSON', value: 'json'},
          {title: 'Bash / Shell', value: 'bash'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'filename',
      title: 'Filename',
      type: 'string',
      description: 'Optional filename tab (e.g., "app.js", "config.yaml").',
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
      validation: (rule) => rule.required(),
      rows: 12,
    }),
    defineField({
      name: 'showLineNumbers',
      title: 'Show Line Numbers',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'highlightLines',
      title: 'Highlight Lines',
      type: 'string',
      description: 'Comma-separated lines to highlight (e.g., "3,5-7").',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional description below the code.',
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {filename: 'filename', language: 'language', code: 'code'},
    prepare({
      filename,
      language,
      code,
    }: {
      filename?: string
      language?: string
      code?: string
    }) {
      const firstLine = code?.split('\n')[0]?.slice(0, 50) ?? ''
      return {
        title: filename || 'Code Block',
        subtitle: `${language ?? 'code'} · ${firstLine}`,
        media: CodeIcon,
      }
    },
  },
})
