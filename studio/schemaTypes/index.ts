import type {SchemaTypeDefinition} from 'sanity'

// Objects
import {blockStylesType} from './objects/block-styles'
import {blockContentType} from './objects/rich-text'
import {linkInternalType, linkExternalType, pageSlugType} from './objects/link'
import {youtubeVideoType, externalVideoType} from './blocks/video'
import {seoType} from './objects/seo'

// Blocks (page builder)
import {blockTypes} from './blocks'

// Documents
import {pageType} from './documents/page'
import {homePageType} from './documents/home-page'
import {siteSettingsType} from './documents/site-settings'
import {practiceAreaType} from './documents/practice-area'

const objectTypes: SchemaTypeDefinition[] = [
  blockStylesType,
  blockContentType,
  linkInternalType,
  linkExternalType,
  pageSlugType,
  seoType,
]

const documentTypes: SchemaTypeDefinition[] = [
  pageType,
  homePageType,
  siteSettingsType,
  practiceAreaType,
]

export const schemaTypes: SchemaTypeDefinition[] = [
  ...documentTypes,
  ...objectTypes,
  ...blockTypes,
]
