import type {StructureResolver} from 'sanity/structure'
import {CogIcon, HomeIcon, DocumentTextIcon} from '@sanity/icons'

const SINGLETONS = ['siteSettings', 'homePage']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singletons
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),

      S.listItem()
        .title('Home Page')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Home Page'),
        ), 

      S.divider(),

      // Pages
      S.documentTypeListItem('page').title('Pages'),

      // Blog
      S.listItem()
        .title('Blog')
        .icon(DocumentTextIcon)
        .child(S.documentTypeList('blogPost').title('Blog Posts')),

      // Filter out singletons from auto-generated list
      ...S.documentTypeListItems().filter(
        (listItem) => !['page', 'blogPost',  ...SINGLETONS].includes(listItem.getId() as string),
      ),
    ])
