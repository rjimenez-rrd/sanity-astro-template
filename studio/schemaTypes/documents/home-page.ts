import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homePageType = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      // English for homePage, Spanish for homePage-es (languages.ts).
      readOnly: true,
      hidden: true,
    }),
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
    select: {language: 'language'},
    prepare({language}: {language?: string}) {
      return {
        title: language === 'es' ? 'Home Page (Español)' : 'Home Page',
        media: HomeIcon,
      }
    },
  },
})
