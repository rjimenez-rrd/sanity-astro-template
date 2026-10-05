/**
 * Which component renders each block type a column can hold. Adding a block:
 * its schema in studio/schemaTypes/blocks, its component in ./blocks, and one
 * line here. A type missing from this list renders as "Unsupported".
 */
import RichText from './blocks/RichText.astro'
import Image from './blocks/Image.astro'
import CallToAction from './blocks/CallToAction.astro'
import Video from './blocks/Video.astro'
import TabbedContent from './blocks/TabbedContent.astro'
import Accordion from './blocks/Accordion.astro'
import SpacerDivider from './blocks/SpacerDivider.astro'
import CountdownTimer from './blocks/CountdownTimer.astro'
import IconText from './blocks/IconText.astro'
import ButtonGroup from './blocks/ButtonGroup.astro'
import StatMetric from './blocks/StatMetric.astro'
import PhoneBlock from './blocks/PhoneBlock.astro'
import TestimonialQuote from './blocks/TestimonialQuote.astro'
import AlertNotice from './blocks/AlertNotice.astro'
import PricingCard from './blocks/PricingCard.astro'
import SocialEmbed from './blocks/SocialEmbed.astro'
import LogoRow from './blocks/LogoRow.astro'
import MapEmbed from './blocks/MapEmbed.astro'
import CodeBlock from './blocks/CodeBlock.astro'
import CustomHtml from './blocks/CustomHtml.astro'
import DataTable from './blocks/DataTable.astro'
import LottieAnimation from './blocks/LottieAnimation.astro'
import FormBlock from './blocks/FormBlock.astro'
import FormCta from './blocks/FormCta.astro'
import CtaBanner from './blocks/CtaBanner.astro'
import LinkList from './blocks/LinkList.astro'
import FaqBlock from './blocks/FaqBlock.astro'
import FeatureCardGrid from './blocks/FeatureCardGrid.astro'
import TestimonialCarousel from './blocks/TestimonialCarousel.astro'
import ImageGallery from './blocks/ImageGallery.astro'
import LawyerCards from './blocks/LawyerCards.astro'
import PracticeAreaCards from './blocks/PracticeAreaCards.astro'
import PracticeAreaGrid from './blocks/PracticeAreaGrid.astro'
import NewsCards from './blocks/NewsCards.astro'
import CaseResultCards from './blocks/CaseResultCards.astro'
import TocBlock from './blocks/TocBlock.astro'

// Block components take differing `data` props; `any` lets one map hold them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, any> = {
  richTextBlock: RichText,
  imageBlock: Image,
  callToAction: CallToAction,
  video: Video,
  tabbedContent: TabbedContent,
  accordion: Accordion,
  spacerDivider: SpacerDivider,
  countdownTimer: CountdownTimer,
  iconText: IconText,
  buttonGroup: ButtonGroup,
  statMetric: StatMetric,
  testimonialQuote: TestimonialQuote,
  alertNotice: AlertNotice,
  pricingCard: PricingCard,
  socialEmbed: SocialEmbed,
  logoRow: LogoRow,
  mapEmbed: MapEmbed,
  codeBlock: CodeBlock,
  htmlBlock: CustomHtml,
  dataTable: DataTable,
  lottieAnimation: LottieAnimation,
  formBlock: FormBlock,
  formCta: FormCta,
  ctaBanner: CtaBanner,
  linkList: LinkList,
  faqBlock: FaqBlock,
  featureCardGrid: FeatureCardGrid,
  testimonialCarousel: TestimonialCarousel,
  imageGallery: ImageGallery,
  lawyerCards: LawyerCards,
  practiceAreaCards: PracticeAreaCards,
  practiceAreaGrid: PracticeAreaGrid,
  newsCards: NewsCards,
  caseResultCards: CaseResultCards,
  phoneBlock: PhoneBlock,
  tocBlock: TocBlock,
}

/**
 * Blocks that put `style`/`class` on their own root element, so their styles
 * go straight on them instead of on a wrapper around them.
 */
export const SELF_STYLED = new Set(['richTextBlock'])
