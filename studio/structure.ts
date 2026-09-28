import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { CogIcon, DocumentsIcon, HomeIcon, PublishIcon, EditIcon, ThListIcon, StarFilledIcon, ComposeIcon, DocumentTextIcon, UsersIcon, TranslateIcon } from '@sanity/icons'
import { DEFAULT_LANGUAGE, HOME_PAGE_IDS, LANGUAGES } from './schemaTypes/languages'

const SINGLETONS = ['siteSettings', 'siteSettingsEs', 'homePage', 'media.tag']

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
  // The Translations plugin's links between language versions; not edited directly.
  'translation.metadata',
  ...SINGLETONS,
]

const NEWEST_FIRST = [{ field: 'publishedAt', direction: 'desc' as const }]

/**
 * One list per language for a translated type. Documents from before
 * languages existed have none and count as the default. "+" in a list creates
 * a document already in that language.
 */
const languageLists = (S: StructureBuilder, type: string, plural: string) =>
  LANGUAGES.map((language) =>
    S.listItem()
      .title(language.title)
      .id(`${type}-${language.id}`)
      .schemaType(type)
      .icon(TranslateIcon)
      .child(
        S.documentList()
          .title(`${plural} (${language.title})`)
          .schemaType(type)
          .filter(`_type == $type && coalesce(language, $defaultLanguage) == $language`)
          .params({ type, language: language.id, defaultLanguage: DEFAULT_LANGUAGE })
          .initialValueTemplates([S.initialValueTemplateItem(`${type}-${language.id}`)])
          .defaultOrdering(NEWEST_FIRST),
      ),
  )

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
      // The Home Page's Spanish translation, served at /es.
      S.listItem()
        .title('Home Page (Español)')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('homePage')
            .documentId(HOME_PAGE_IDS.es)
            .title('Home Page (Español)'),
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
              S.divider().title('By language'),
              ...languageLists(S, 'page', 'Pages'),
            ]),
        ),
      S.listItem()
        .title('Practice Areas')
        .id('practice-areas')
        .schemaType('practiceArea')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Practice Areas')
            .items([
              S.documentTypeListItem('practiceArea').title('All Practice Areas').icon(DocumentTextIcon),
              S.divider().title('By language'),
              ...languageLists(S, 'practiceArea', 'Practice Areas'),
            ]),
        ),
      S.documentTypeListItem('review').title('Reviews').icon(StarFilledIcon),
      S.documentTypeListItem('lawyer').title('Lawyers').icon(UsersIcon),
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
      S.listItem()
        .title('CTA Forms')
        .id('cta-forms')
        .schemaType('ctaForm')
        .icon(ComposeIcon)
        .child(
          S.list()
            .title('CTA Forms')
            .items([
              S.documentTypeListItem('ctaForm').title('All CTA Forms').icon(ComposeIcon),
              S.divider().title('By language'),
              ...languageLists(S, 'ctaForm', 'CTA Forms'),
            ]),
        ),

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
      // The Spanish words for the header, menus and footer on /es/ pages.
      S.listItem()
        .title('Site Settings (Español)')
        .icon(TranslateIcon)
        .child(
          S.document()
            .schemaType('siteSettingsEs')
            .documentId('siteSettingsEs')
            .title('Site Settings (Español)'),
        ),
    ])
