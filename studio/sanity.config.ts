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
import {singletonTypes, singletonActions} from './schemaTypes/shared/constants'

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
          blogPost: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: doc?.slug
                ? [
                    {title: doc.title || 'Untitled post', href: `/blog/${doc.slug}`},
                    {title: 'Blog index', href: '/blog'},
                  ]
                : [],
            }),
          }),
        },
        mainDocuments: defineDocuments([
          {route: '/', filter: '_id == "homePage" || _id == "drafts.homePage"'},
          {route: '/blog/:slug', filter: '_type == "blogPost" && slug.current == $slug'},
          {route: '/:slug', filter: '_type == "page" && slug.current == $slug'},
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
      return [...actions, openInPresentation]
    },
    newDocumentOptions: (prev) =>
      prev.filter((item) => !singletonTypes.has(item.templateId)),
  },
})
