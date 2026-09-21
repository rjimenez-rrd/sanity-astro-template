import type {StructureResolver} from 'sanity/structure'
import {CaseIcon, CogIcon, HomeIcon} from '@sanity/icons'

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

      // Practice areas
      S.listItem()
        .title('Practice Areas')
        .icon(CaseIcon)
        .child(S.documentTypeList('practiceArea').title('Practice Areas')),

      // Filter out singletons from auto-generated list
      ...S.documentTypeListItems().filter(
        (listItem) => !['page', 'practiceArea', ...SINGLETONS].includes(listItem.getId() as string),
      ),
    ])
