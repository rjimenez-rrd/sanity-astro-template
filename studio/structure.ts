import type { StructureResolver } from 'sanity/structure'
import { CogIcon, DocumentsIcon, HomeIcon } from '@sanity/icons'

const SINGLETONS = ['siteSettings', 'homePage', 'media.tag']

/**
 * Types given an explicit item below. The catch-all at the end skips these, so
 * adding one here is all it takes to avoid a duplicate-ID error.
 */
const PLACED = [
  'page',
  'practiceArea',
  'review',
  'lawyer',
  'caseResult',
  'newsPost',
  'newsCategory',
  'formCtaSection',
  ...SINGLETONS,
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Dashboard')
    .items([
      // Grouped by what an editor is trying to do, not by how the schema is
      // built: the pages they edit daily first, configuration last. A titled
      // divider labels the group beneath it.
      S.divider().title('Singletons'),

      S.listItem()
        .title('Home Page')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Home Page'),
        ),

      S.divider().title('Content'),
      S.documentTypeListItem('page').title('Pages'),
      // S.listItem()
      //   .title('Pages')
      //   .schemaType('page')
      //   .child(
      //     S.documentTypeList('page')
      //       .title('Pages')
      //       .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]), // newest first
      //   ),
      S.documentTypeListItem('practiceArea').title('Practice Areas'),
      S.documentTypeListItem('review').title('Reviews'),
      S.documentTypeListItem('lawyer').title('Lawyers'),
      // Categories only exist to label posts, so they live inside News rather
      // than beside it.
      S.listItem()
        .title('News')
        .id('news')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('News')
            .items([
              S.documentTypeListItem('newsPost').title('All News'),
              S.documentTypeListItem('newsCategory').title('Categories'),
            ]),
        ),
      S.documentTypeListItem('caseResult').title('Case Results'),
      S.documentTypeListItem('formCtaSection').title('Form CTAs'),

      // Any document type not placed above, so a new one still shows up.
      ...S.documentTypeListItems().filter(
        (listItem) => {
          const id = listItem.getId() as string
          return !PLACED.includes(id)
        },
      ),

      S.divider().title('Settings'),

      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),
    ])
