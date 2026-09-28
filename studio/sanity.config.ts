import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {table} from '@sanity/table'
import {media} from 'sanity-plugin-media'
import {documentInternationalization} from '@sanity/document-internationalization'

import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {openInPresentation} from './actions/openInPresentation'
import {openInBrowser} from './actions/openInBrowser'
import {PUBLISH_DATE_TYPES, withPublishDate} from './actions/publishWithDate'
import {singletonTypes, singletonActions} from './schemaTypes/constants'
import {LAST_EDITED_TYPES, StampLastEditor} from './actions/stampLastEditor'
import {DEFAULT_LANGUAGE, HOME_PAGE_IDS, LANGUAGES, TRANSLATED_TYPES} from './schemaTypes/languages'

/** /about-us for the default language, /es/sobre-nosotros for the others. */
const localizedPath = (slug: string, language?: string) =>
  !language || language === DEFAULT_LANGUAGE ? `/${slug}` : `/${language}/${slug}`

/** GROQ: a document's language, treating ones from before languages as the default. */
const LANGUAGE_IS = (id: string) => `coalesce(language, "${DEFAULT_LANGUAGE}") == "${id}"`

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!
const dataset = process.env.SANITY_STUDIO_DATASET!

export default defineConfig({
  name: 'default',
  title: 'Studio',

  projectId,
  dataset,

  plugins: [
    structureTool({structure}),
    presentationTool({
      /**
       * Without this, Presentation has no idea which URL a document appears on,
       * so opening any document just parks the preview on the home page.
       * `locations` answers document -> URL; `mainDocuments` answers the
       * reverse, so browsing the preview opens the matching document.
       */
      resolve: {
        locations: {
          homePage: defineLocations({
            select: {language: 'language'},
            resolve: (doc) => ({
              message: 'This document is used on the home page',
              locations: [
                doc?.language && doc.language !== DEFAULT_LANGUAGE
                  ? {title: 'Inicio', href: `/${doc.language}`}
                  : {title: 'Home', href: '/'},
              ],
            }),
          }),
          page: defineLocations({
            select: {title: 'title', slug: 'slug.current', language: 'language'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [{title: doc.title || 'Untitled page', href: localizedPath(doc.slug, doc.language)}]
                : [],
            }),
          }),
          newsPost: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {title: doc.title || 'Untitled news', href: `/news/${doc.slug}`},
                    {title: 'News', href: '/news'},
                  ]
                : [],
            }),
          }),
          practiceArea: defineLocations({
            select: {title: 'title', slug: 'slug.current', language: 'language'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {
                      title: doc.title || 'Untitled practice area',
                      href: localizedPath(doc.slug, doc.language),
                    },
                    {title: 'Practice Areas', href: '/practice-areas'},
                  ]
                : [],
            }),
          }),
        },
        mainDocuments: defineDocuments([
          {route: '/', filter: '_id == "homePage" || _id == "drafts.homePage"'},
          {route: '/es', filter: `_id in ["${HOME_PAGE_IDS.es}", "drafts.${HOME_PAGE_IDS.es}"]`},
          {route: '/news/:slug', filter: '_type == "newsPost" && slug.current == $slug'},
          // Other languages first, so /es/… isn't read as a slug "es".
          ...LANGUAGES.filter((l) => l.id !== DEFAULT_LANGUAGE).map((l) => ({
            route: `/${l.id}/:slug`,
            filter: `_type in ["page", "practiceArea"] && slug.current == $slug && ${LANGUAGE_IS(l.id)}`,
          })),
          {
            route: '/:slug',
            filter: `_type in ["page", "practiceArea"] && slug.current == $slug && ${LANGUAGE_IS(DEFAULT_LANGUAGE)}`,
          },
          // Later pages of a paginated card list are the same document.
          {
            route: '/:slug/page/:page',
            filter: `_type in ["page", "practiceArea"] && slug.current == $slug && ${LANGUAGE_IS(DEFAULT_LANGUAGE)}`,
          },
        ]),
      },
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
    /**
     * Translations: a menu on each Page and Practice Area to create or open
     * its version in another language. Creating one copies the document, so
     * the layout is already there and only the words need translating.
     */
    documentInternationalization({
      supportedLanguages: [...LANGUAGES],
      schemaTypes: TRANSLATED_TYPES,
      languageField: 'language',
    }),
    visionTool(),
    media(),
    colorInput(),
    table(),
  ],

  schema: {
    types: schemaTypes,
    // The plain Page / Practice Area templates would create documents with no
    // language; the plugin's per-language ones ("Page (English)") replace them.
    templates: (prev) =>
      prev.filter(
        (t) => !singletonTypes.has(t.schemaType ?? t.id) && !TRANSLATED_TYPES.includes(t.id),
      ),
  },

  document: {
    actions: (input, context) => {
      const filtered = singletonTypes.has(context.schemaType)
        ? input.filter(({action}) => action && singletonActions.has(action))
        : input
      // Pages get their publishedAt stamped on first publish.
      const actions = PUBLISH_DATE_TYPES.has(context.schemaType)
        ? filtered.map((action) => (action.action === 'publish' ? withPublishDate(action) : action))
        : filtered
      // Buttonless: records the last editor for the list row.
      const stamp = LAST_EDITED_TYPES.has(context.schemaType) ? [StampLastEditor] : []
      // Appended after the filter so singletons keep it too.
      return [...actions, openInPresentation, openInBrowser, ...stamp]
    },
    newDocumentOptions: (prev) =>
      prev.filter((item) => !singletonTypes.has(item.templateId)),
  },
})
