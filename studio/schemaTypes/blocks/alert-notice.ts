import {defineType, defineField} from 'sanity'
import {InfoOutlineIcon} from '@sanity/icons'
import {AlertNoticePreview} from '../../components/previews/AlertNoticePreview'

export const alertNoticeType = defineType({
  name: 'alertNotice',
  title: 'Alert / Notice',
  type: 'object',
  icon: InfoOutlineIcon,
  components: {
    input: AlertNoticePreview,
  },
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      description: 'Determines the color and icon.',
      initialValue: 'info',
      validation: (rule) => rule.required(),
      options: {
        list: [
          {title: 'Info', value: 'info'},
          {title: 'Success', value: 'success'},
          {title: 'Warning', value: 'warning'},
          {title: 'Error', value: 'error'},
          {title: 'Tip', value: 'tip'},
        ],
      },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional bold heading.',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The alert message.',
    }),
    defineField({
      name: 'dismissible',
      title: 'Dismissible',
      type: 'boolean',
      description: 'Allow the visitor to close this alert.',
      initialValue: false,
    }),
    defineField({
      name: 'icon',
      title: 'Custom Icon',
      type: 'image',
      description: 'Override the default icon for this alert type.',
    }),
    defineField({
      name: 'blockStyles',
      title: 'Block Styles',
      type: 'blockStyles',
      options: {collapsible: true, collapsed: true},
    }),
  ],
  preview: {
    select: {type: 'type', title: 'title', message: 'message'},
    prepare({type, title, message}: {type?: string; title?: string; message?: string}) {
      const typeLabel =
        {info: 'Info', success: 'Success', warning: 'Warning', error: 'Error', tip: 'Tip'}[
          type ?? 'info'
        ] ?? 'Info'
      return {
        title: `${typeLabel}: ${title || (message ? message.slice(0, 50) : 'Alert')}`,
        subtitle: type ?? 'info',
        media: InfoOutlineIcon,
      }
    },
  },
})
