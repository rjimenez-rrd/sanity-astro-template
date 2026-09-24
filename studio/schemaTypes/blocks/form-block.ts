import {defineType, defineField, defineArrayMember} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'
import {ColorStringInput} from '../../components/inputs/ColorStringInput'

const FIELD_TYPES = [
  {title: 'Text', value: 'text'},
  {title: 'Email', value: 'email'},
  {title: 'Phone', value: 'tel'},
  {title: 'Number', value: 'number'},
  {title: 'Textarea', value: 'textarea'},
  {title: 'Select', value: 'select'},
  {title: 'Checkbox', value: 'checkbox'},
] as const

const WIDTH_OPTIONS = [
  {title: 'Full', value: 'full'},
  {title: 'Half', value: 'half'},
] as const

export const formBlockType = defineType({
  name: 'formBlock',
  title: 'Form',
  type: 'object',
  icon: EnvelopeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'fields', title: 'Fields'},
    {name: 'submit', title: 'Submit'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'formTitle',
      title: 'Form Title',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'formDescription',
      title: 'Form Description',
      type: 'text',
      group: 'content',
      rows: 2,
    }),
    defineField({
      name: 'fields',
      title: 'Form Fields',
      type: 'array',
      group: 'fields',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'formField',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'name',
              title: 'Field Name',
              type: 'string',
              description: 'Machine-readable name (e.g., "full_name")',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              initialValue: 'text',
              options: {list: [...FIELD_TYPES]},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'placeholder',
              title: 'Placeholder',
              type: 'string',
            }),
            defineField({
              name: 'required',
              title: 'Required',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'options',
              title: 'Options',
              type: 'array',
              description: 'For select fields only',
              of: [defineArrayMember({type: 'string'})],
              hidden: ({parent}) => parent?.type !== 'select',
            }),
            defineField({
              name: 'width',
              title: 'Width',
              type: 'string',
              initialValue: 'full',
              options: {list: [...WIDTH_OPTIONS], layout: 'radio'},
            }),
          ],
          preview: {
            select: {label: 'label', type: 'type', required: 'required'},
            prepare({
              label,
              type,
              required,
            }: {
              label?: string
              type?: string
              required?: boolean
            }) {
              return {
                title: label || 'Field',
                subtitle: `${type || 'text'}${required ? ' *' : ''}`,
              }
            },
          },
        }),
      ],
    }),

    // Submit settings
    defineField({
      name: 'submitLabel',
      title: 'Submit Button Label',
      type: 'string',
      group: 'submit',
      initialValue: 'Submit',
    }),
    defineField({
      name: 'submitAction',
      title: 'Submit Action',
      type: 'string',
      group: 'submit',
      initialValue: 'webhook',
      options: {
        list: [
          {title: 'Webhook (POST to URL)', value: 'webhook'},
          {title: 'Custom Endpoint', value: 'custom'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'webhookUrl',
      title: 'Webhook URL',
      type: 'url',
      group: 'submit',
      description: 'Form data will be POSTed here as JSON',
      hidden: ({parent}) => parent?.submitAction !== 'webhook',
    }),
    defineField({
      name: 'customEndpoint',
      title: 'Custom API Endpoint',
      type: 'string',
      group: 'submit',
      description: 'Relative path (e.g., /api/contact)',
      hidden: ({parent}) => parent?.submitAction !== 'custom',
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'string',
      group: 'submit',
      initialValue: 'Thank you! Your submission has been received.',
    }),
    defineField({
      name: 'errorMessage',
      title: 'Error Message',
      type: 'string',
      group: 'submit',
      initialValue: 'Something went wrong. Please try again.',
    }),

    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      group: 'submit',
      description: 'Small print above the button, e.g. "This site is protected by reCAPTCHA."',
    }),

    // Style
    defineField({
      name: 'formStyle',
      title: 'Form Style',
      type: 'string',
      group: 'style',
      description: 'On Dark: white labels, square white fields and a white button, for a dark background.',
      initialValue: 'default',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'On Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'buttonColor',
      title: 'Button Color',
      type: 'string',
      group: 'style',
      description: 'Hex color for submit button',
      components: {input: ColorStringInput},
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
    select: {title: 'formTitle'},
    prepare({title}: {title?: string}) {
      return {
        title: title || 'Form',
        subtitle: 'Form Block',
        media: EnvelopeIcon,
      }
    },
  },
})
