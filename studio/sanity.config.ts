import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {table} from '@sanity/table'
import {media} from 'sanity-plugin-media'

import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {openInPresentation} from './actions/openInPresentation'
import {openInBrowser} from './actions/openInBrowser'
import {singletonTypes, singletonActions} from './schemaTypes/constants'

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
            message: 'This document is used on the home page',
            locations: [{title: 'Home', href: '/'}],
          }),
          page: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [{title: doc.title || 'Untitled page', href: `/${doc.slug}`}]
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
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {title: doc.title || 'Untitled practice area', href: `/${doc.slug}`},
                    {title: 'Practice Areas', href: '/practice-areas'},
                  ]
                : [],
            }),
          }),
        },
        mainDocuments: defineDocuments([
          {route: '/', filter: '_id == "homePage" || _id == "drafts.homePage"'},
          {route: '/news/:slug', filter: '_type == "newsPost" && slug.current == $slug'},
          {route: '/:slug', filter: '_type in ["page", "practiceArea"] && slug.current == $slug'},
          // Later pages of a paginated card list are the same document.
          {route: '/:slug/page/:page', filter: '_type in ["page", "practiceArea"] && slug.current == $slug'},
        ]),
      },
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
    visionTool(),
    media(),
    colorInput(),
    table(),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) =>
      prev.filter((t) => !singletonTypes.has(t.schemaType ?? t.id)),
  },

  document: {
    actions: (input, context) => {
      const actions = singletonTypes.has(context.schemaType)
        ? input.filter(({action}) => action && singletonActions.has(action))
        : input
      // Appended after the filter so singletons keep it too.
      return [...actions, openInPresentation, openInBrowser]
    },
    newDocumentOptions: (prev) =>
      prev.filter((item) => !singletonTypes.has(item.templateId)),
  },
})
