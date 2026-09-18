import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {table} from '@sanity/table'
import {media} from 'sanity-plugin-media'

import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
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
      if (singletonTypes.has(context.schemaType)) {
        return input.filter(
          ({action}) => action && singletonActions.has(action),
        )
      }
      return input
    },
    newDocumentOptions: (prev) =>
      prev.filter((item) => !singletonTypes.has(item.templateId)),
  },
})
