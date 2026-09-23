import type {
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  PRACTICE_AREAS_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '@/sanity/types.generated'

// ---------- Settings ----------
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>
export type NavItem = NonNullable<SiteSettings['mainNav']>[number]
export type NavLink = Extract<NavItem, {_type: 'navLink'}>
export type NavDropdown = Extract<NavItem, {_type: 'navDropdown'}>
export type DropdownItem = NavDropdown['items'][number]
export type FooterColumn = NonNullable<SiteSettings['footerColumns']>[number]
export type FooterLink = NonNullable<FooterColumn['links']>[number]
export type SocialLink = NonNullable<SiteSettings['socialLinks']>[number]

// ---------- Pages ----------
export type HomePage = HOME_PAGE_QUERY_RESULT
export type PageData = NonNullable<PAGE_QUERY_RESULT>

// ---------- Practice areas ----------
export type PracticeAreaListItem = PRACTICE_AREAS_QUERY_RESULT[number]

// ---------- Page Builder ----------
// PAGE_QUERY_RESULT has pageBuilder as a non-null array on its type, so use it directly
export type PageBuilderBlock = NonNullable<PageData['pageBuilder']>[number]
export type HeroSectionData = Extract<PageBuilderBlock, {_type: 'heroSection'}>
export type GridRowData = Extract<PageBuilderBlock, {_type: 'gridRow'}>
export type GridColumn = GridRowData['columns'][number]
export type ContentBlock = NonNullable<GridColumn['content']>[number]

// ---------- Content block types ----------
export type RichTextBlockData = Extract<ContentBlock, {_type: 'richTextBlock'}>
export type ImageBlockData = Extract<ContentBlock, {_type: 'imageBlock'}>
export type CallToActionData = Extract<ContentBlock, {_type: 'callToAction'}>
export type ExternalVideoData = Extract<ContentBlock, {_type: 'externalVideo'}>
export type YoutubeVideoData = Extract<ContentBlock, {_type: 'youtubeVideo'}>
export type TabbedContentData = Extract<ContentBlock, {_type: 'tabbedContent'}>
export type AccordionData = Extract<ContentBlock, {_type: 'accordion'}>
export type SpacerDividerData = Extract<ContentBlock, {_type: 'spacerDivider'}>
export type CountdownTimerData = Extract<ContentBlock, {_type: 'countdownTimer'}>
export type IconTextData = Extract<ContentBlock, {_type: 'iconText'}>
export type ButtonGroupData = Extract<ContentBlock, {_type: 'buttonGroup'}>
export type StatMetricData = Extract<ContentBlock, {_type: 'statMetric'}>
export type TestimonialQuoteData = Extract<ContentBlock, {_type: 'testimonialQuote'}>
export type AlertNoticeData = Extract<ContentBlock, {_type: 'alertNotice'}>
export type PricingCardData = Extract<ContentBlock, {_type: 'pricingCard'}>
export type SocialEmbedData = Extract<ContentBlock, {_type: 'socialEmbed'}>
export type LogoRowData = Extract<ContentBlock, {_type: 'logoRow'}>
export type MapEmbedData = Extract<ContentBlock, {_type: 'mapEmbed'}>
export type CodeBlockData = Extract<ContentBlock, {_type: 'codeBlock'}>
export type DataTableData = Extract<ContentBlock, {_type: 'dataTable'}>
export type LottieAnimationData = Extract<ContentBlock, {_type: 'lottieAnimation'}>
export type FormBlockData = Extract<ContentBlock, {_type: 'formBlock'}>
export type FaqBlockData = Extract<ContentBlock, {_type: 'faqBlock'}>
export type FeatureCardGridData = Extract<ContentBlock, {_type: 'featureCardGrid'}>
export type TestimonialCarouselData = Extract<ContentBlock, {_type: 'testimonialCarousel'}>
export type ImageGalleryData = Extract<ContentBlock, {_type: 'imageGallery'}>
export type TocBlockData = Extract<ContentBlock, {_type: 'tocBlock'}>
export type NestedContainerData = Extract<ContentBlock, {_type: 'nestedContainer'}>
export type LawyerCardsData = Extract<ContentBlock, {_type: 'lawyerCards'}>
export type CaseResultCardsData = Extract<ContentBlock, {_type: 'caseResultCards'}>

// ---------- SEO ----------
export type SeoData = NonNullable<PageData['seo']>
