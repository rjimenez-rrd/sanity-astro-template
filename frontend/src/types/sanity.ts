import type {
  PAGE_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '@/sanity/types.generated'

// ---------- Settings ----------
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>
export type NavItem = NonNullable<SiteSettings['mainNav']>[number]
export type NavLink = Extract<NavItem, {_type: 'navLink'}>
export type NavDropdown = Extract<NavItem, {_type: 'navDropdown'}>

// ---------- Pages ----------
// PAGE_QUERY returns every page sharing the slug (lib/pageRoute.ts picks one).
export type PageData = PAGE_QUERY_RESULT[number]
/** A Practice Area: a page plus its template's hero and sidebar. */
export type PracticeAreaPageData = Extract<PageData, {_type: 'practiceArea'}>

// ---------- Page Builder ----------
// PAGE_QUERY_RESULT has pageBuilder as a non-null array on its type, so use it directly
export type PageBuilderBlock = NonNullable<PageData['pageBuilder']>[number]
/**
 * A top-level Container. The stored `_type` is still `gridRow` — it is on every
 * container already saved, so renaming it would orphan them — but nothing an
 * editor or a reader of this code sees calls it that any more.
 */
export type ContainerBlockData = Extract<PageBuilderBlock, {_type: 'gridRow'}>
export type ContainerColumn = ContainerBlockData['columns'][number]
export type ContentBlock = NonNullable<ContainerColumn['content']>[number]

// ---------- Content block types ----------
export type RichTextBlockData = Extract<ContentBlock, {_type: 'richTextBlock'}>
export type ImageBlockData = Extract<ContentBlock, {_type: 'imageBlock'}>
export type CallToActionData = Extract<ContentBlock, {_type: 'callToAction'}>
export type VideoData = Extract<ContentBlock, {_type: 'video'}>
export type TabbedContentData = Extract<ContentBlock, {_type: 'tabbedContent'}>
export type AccordionData = Extract<ContentBlock, {_type: 'accordion'}>
export type SpacerDividerData = Extract<ContentBlock, {_type: 'spacerDivider'}>
export type CountdownTimerData = Extract<ContentBlock, {_type: 'countdownTimer'}>
export type IconTextData = Extract<ContentBlock, {_type: 'iconText'}>
export type ButtonGroupData = Extract<ContentBlock, {_type: 'buttonGroup'}>
export type StatMetricData = Extract<ContentBlock, {_type: 'statMetric'}>
export type PhoneBlockData = Extract<ContentBlock, {_type: 'phoneBlock'}>
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
export type PracticeAreaCardsData = Extract<ContentBlock, {_type: 'practiceAreaCards'}>
export type PracticeAreaGridData = Extract<ContentBlock, {_type: 'practiceAreaGrid'}>
export type NewsCardsData = Extract<ContentBlock, {_type: 'newsCards'}>
export type CaseResultCardsData = Extract<ContentBlock, {_type: 'caseResultCards'}>
export type FormCtaData = Extract<ContentBlock, {_type: 'formCta'}>
export type CtaBannerData = Extract<ContentBlock, {_type: 'ctaBanner'}>
export type LinkListData = Extract<ContentBlock, {_type: 'linkList'}>

// ---------- Practice areas ----------
/** One practice area card, as the Practice Area Cards and Grid blocks resolve it. */
export type PracticeAreaListItem = NonNullable<PracticeAreaGridData['practiceAreas']>[number]
