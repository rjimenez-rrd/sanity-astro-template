import type {SchemaTypeDefinition} from 'sanity'

// Objects
import {blockStylesType} from './objects/block-styles'
import {blockContentType} from './objects/rich-text'
import {linkInternalType, linkExternalType, pageSlugType, linkSitePageType} from './objects/link'
import {seoType} from './objects/seo'
import {siteInfoType} from './objects/site-info'
import {textStyleType} from './objects/text-style'

// Blocks (page builder)
import {blockTypes} from './blocks'

// Documents
import {pageType} from './documents/page'
import {homePageType} from './documents/home-page'
import {siteSettingsType, footerLinkType} from './documents/site-settings'
import {siteSettingsEsType} from './documents/site-settings-es'
import {practiceAreaType} from './documents/practice-area'
import {reviewType} from './documents/review'
import {lawyerType} from './documents/lawyer'
import {newsPostType} from './documents/news-post'
import {newsCategoryType} from './documents/news-category'
import {ctaFormType} from './documents/form-cta'
import {caseResultType} from './documents/case-result'

const objectTypes: SchemaTypeDefinition[] = [
  blockStylesType,
  blockContentType,
  linkInternalType,
  linkExternalType,
  pageSlugType,
  linkSitePageType,
  seoType,
  siteInfoType,
  textStyleType,
]

const documentTypes: SchemaTypeDefinition[] = [
  pageType,
  homePageType,
  siteSettingsType,
  siteSettingsEsType,
  footerLinkType,
  practiceAreaType,
  reviewType,
  lawyerType,
  newsPostType,
  newsCategoryType,
  ctaFormType,
  caseResultType,
]

export const schemaTypes: SchemaTypeDefinition[] = [
  ...documentTypes,
  ...objectTypes,
  ...blockTypes,
]
