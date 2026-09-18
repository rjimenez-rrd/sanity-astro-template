import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homePageType = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pageBuilder',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: true},
    }),
    
  ],
  preview: {
    prepare() {
      return {
        title: 'Home Page',
        media: HomeIcon,
      }
    },
  },
})
