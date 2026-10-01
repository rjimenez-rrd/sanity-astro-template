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
import {DeleteWithTranslations} from './actions/deleteWithTranslations'
import {DEFAULT_LANGUAGE, HOME_PAGE_IDS, LANGUAGES, TRANSLATED_TYPES} from './schemaTypes/languages'
import {MAX_ANCESTORS} from './schemaTypes/fields/rootSlug'
import {pagePath} from './actions/documentPath'

/** /about-us for the default language, /es/sobre-nosotros for the others. */
/** GROQ: a document's language, treating ones from before languages as the default. */
const LANGUAGE_IS = (id: string) => `coalesce(language, "${DEFAULT_LANGUAGE}") == "${id}"`

/** A page's ancestors' slugs, root first, as Presentation's locations select them. */
const ANCESTOR_SELECT = {
  p1: 'parent.slug.current',
  p2: 'parent.parent.slug.current',
  p3: 'parent.parent.parent.slug.current',
}
const ancestorsOf = (doc: {p1?: string; p2?: string; p3?: string}) => [doc.p3, doc.p2, doc.p1]

/**
 * URL -> page, for every depth: /:slug, /:p1/:slug … /:p3/:p2/:p1/:slug, where
 * p1 is the parent's slug, p2 the grandparent's, and the chain has to end
 * there (no further parent). Each also has its /page/:page list pages, listed
 * first so /about-us/page/2 isn't read as a page "2" under "page".
 */
function pageRoutes(prefix: string, language: string) {
  const routes: {route: string; filter: string}[] = []
  const lists: typeof routes = []
  for (let depth = MAX_ANCESTORS; depth >= 0; depth--) {
    const params = Array.from({length: depth}, (_, i) => `:p${depth - i}`)
    const chain = Array.from({length: depth}, (_, i) => ` && ${'parent->'.repeat(i + 1)}slug.current == $p${i + 1}`)
    const filter =
      `_type in ["page", "practiceArea"] && slug.current == $slug && ${LANGUAGE_IS(language)}` +
      chain.join('') +
      ` && !defined(${'parent->'.repeat(depth)}parent)`
    const route = [prefix, ...params, ':slug'].join('/')
    lists.push({route: `${route}/page/:page`, filter})
    routes.push({route, filter})
  }
  return [...lists, ...routes]
}

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
            select: {title: 'title', slug: 'slug.current', language: 'language', ...ANCESTOR_SELECT},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [{title: doc.title || 'Untitled page', href: pagePath(doc.slug, doc.language, ancestorsOf(doc))}]
                : [],
            }),
          }),
          // /news/<slug>, and /es/news/<slug> for a Spanish post.
          newsPost: defineLocations({
            select: {title: 'title', slug: 'slug.current', language: 'language'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {title: doc.title || 'Untitled news', href: pagePath(doc.slug, doc.language, ['news'])},
                    {
                      title: doc.language && doc.language !== DEFAULT_LANGUAGE ? 'Noticias' : 'News',
                      href: pagePath('news', doc.language),
                    },
                  ]
                : [],
            }),
          }),
          practiceArea: defineLocations({
            select: {title: 'title', slug: 'slug.current', language: 'language', ...ANCESTOR_SELECT},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {
                      title: doc.title || 'Untitled practice area',
                      href: pagePath(doc.slug, doc.language, ancestorsOf(doc)),
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
          // Before the pages, so /es/news/… isn't read as a page under "news".
          ...LANGUAGES.filter((l) => l.id !== DEFAULT_LANGUAGE).map((l) => ({
            route: `/${l.id}/news/:slug`,
            filter: `_type == "newsPost" && slug.current == $slug && ${LANGUAGE_IS(l.id)}`,
          })),
          {route: '/news/:slug', filter: `_type == "newsPost" && slug.current == $slug && ${LANGUAGE_IS(DEFAULT_LANGUAGE)}`},
          // Other languages first, so /es/… isn't read as a page "es".
          ...LANGUAGES.filter((l) => l.id !== DEFAULT_LANGUAGE).flatMap((l) => pageRoutes(`/${l.id}`, l.id)),
          ...pageRoutes('', DEFAULT_LANGUAGE),
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
     * Translations: a menu on each Page, Practice Area and News post to create or open
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
    // The plain Page / Practice Area / News templates would create documents with no
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
      const translated = TRANSLATED_TYPES.includes(context.schemaType)
      const actions = filtered.map((action) => {
        if (action.action === 'publish' && PUBLISH_DATE_TYPES.has(context.schemaType)) return withPublishDate(action)
        // Delete also removes the document from its translation links.
        if (action.action === 'delete' && translated) return DeleteWithTranslations
        return action
      })
      // Buttonless: records the last editor for the list row.
      const stamp = LAST_EDITED_TYPES.has(context.schemaType) ? [StampLastEditor] : []
      // Appended after the filter so singletons keep it too.
      return [...actions, openInPresentation, openInBrowser, ...stamp]
    },
    newDocumentOptions: (prev) =>
      prev.filter((item) => !singletonTypes.has(item.templateId)),
  },
})
