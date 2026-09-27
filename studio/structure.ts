import type { StructureResolver } from 'sanity/structure'
import { CogIcon, DocumentsIcon, HomeIcon, PublishIcon, EditIcon, ThListIcon, StarFilledIcon, ComposeIcon } from '@sanity/icons'

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
  'ctaForm',
  ...SINGLETONS,
]

const NEWEST_FIRST = [{ field: 'publishedAt', direction: 'desc' as const }]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('The Sanders Law Firm')
    .items([
      // Grouped by what an editor is trying to do, not by how the schema is
      // built: the pages they edit daily first, configuration last. A titled
      // divider labels the group beneath it.
      S.divider().title('Main'),

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
      // Lists query through the Studio's drafts perspective, which rewrites
      // every _id to the published one, so `_id in path("drafts.**")` never
      // matches. _originalId keeps the real id, telling a draft apart. But the
      // same filter also drives the list's live listener, which sees raw
      // documents without _originalId: there `!defined(_originalId)` lets
      // every page through, so any change (a delete too) refreshes the list.
      S.listItem()
        .title('Pages')
        .id('pages')
        .schemaType('page')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('All Pages')
                .id('pages-all')
                .schemaType('page')
                .icon(DocumentsIcon)
                .child(
                  S.documentTypeList('page')
                    .title('All Pages')
                    .defaultOrdering(NEWEST_FIRST),
                ),
              S.listItem()
                .title('Published')
                .id('pages-published')
                .schemaType('page')
                .icon(PublishIcon)
                .child(
                  S.documentList()
                    .title('Published')
                    .schemaType('page')
                    .filter('_type == "page" && (!defined(_originalId) || !(_originalId in path("drafts.**")))')
                    .defaultOrdering(NEWEST_FIRST),
                ),
              // Never published, or live with edits not yet published.
              S.listItem()
                .title('Drafts')
                .id('pages-drafts')
                .schemaType('page')
                .icon(EditIcon)
                .child(
                  S.documentList()
                    .title('Drafts')
                    .schemaType('page')
                    .filter('_type == "page" && (!defined(_originalId) || _originalId in path("drafts.**"))')
                    .defaultOrdering(NEWEST_FIRST),
                ),
            ]),
        ),
      S.documentTypeListItem('practiceArea').title('Practice Areas'),
      S.documentTypeListItem('review').title('Reviews').icon(StarFilledIcon),
      S.documentTypeListItem('lawyer').title('Lawyers'),
      // Categories only exist to label posts, so they live inside News rather
      // than beside it.
      S.listItem()
        .title('News')
        .id('news')
        .icon(ThListIcon)
        .child(
          S.list()
            .title('News')
            .items([
              S.documentTypeListItem('newsPost').title('All News'),
              S.documentTypeListItem('newsCategory').title('Categories'),
            ]),
        ),
      S.documentTypeListItem('caseResult').title('Case Results'),
      S.documentTypeListItem('ctaForm').title('CTA Forms').icon(ComposeIcon),

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
