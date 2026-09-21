/**
 * Seed script — creates demo content showcasing all content types.
 *
 * Usage:
 *   PUBLIC_SANITY_PROJECT_ID=xxx PUBLIC_SANITY_DATASET=production SANITY_API_WRITE_TOKEN=xxx npx tsx scripts/seed-demo-data.ts
 *
 * Note: Content types that require image uploads (imageBlock, iconText, logoRow,
 * testimonialQuote avatar, socialEmbed, mapEmbed, lottieAnimation) are not seeded
 * here — add them manually in the Studio where you can upload images.
 */

import {createClient} from '@sanity/client'

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2025-03-20', useCdn: false})

function k() {
  return Math.random().toString(36).slice(2, 14)
}

// ---------------------------------------------------------------------------
// Block helpers
// ---------------------------------------------------------------------------
function textBlock(text: string, style = 'normal') {
  return {
    _type: 'block',
    _key: k(),
    style,
    children: [{_type: 'span', _key: k(), text, marks: []}],
    markDefs: [],
  }
}

function ctaButton(
  label: string,
  slug: string,
  variant = 'primary',
  color?: string,
  textColor?: string,
) {
  return {
    _key: k(),
    _type: 'callToAction',
    label,
    variant,
    color: color || undefined,
    textColor: textColor || undefined,
    link: [{_key: k(), _type: 'pageSlug', title: label, slug}],
  }
}

function extLink(label: string, url: string, variant = 'secondary') {
  return {
    _key: k(),
    _type: 'callToAction',
    label,
    variant,
    link: [{_key: k(), _type: 'linkExternal', title: label, url, openInNewTab: true}],
  }
}

interface BlockStylesInput {
  pt?: string
  pr?: string
  pb?: string
  pl?: string
  mt?: string
  mb?: string
  bgColor?: string
  textAlign?: string
  fontSize?: string
  textColor?: string
  borderRadius?: string
  shadow?: string
  opacity?: number
}

function blockStyles(s: BlockStylesInput) {
  return {
    padding: {
      top: s.pt || '0',
      right: s.pr || '0',
      bottom: s.pb || '0',
      left: s.pl || '0',
    },
    margin: {
      top: s.mt || '0',
      right: '0',
      bottom: s.mb || '0',
      left: '0',
    },
    background: s.bgColor ? {color: s.bgColor} : undefined,
    typography: {
      textAlign: s.textAlign || undefined,
      fontSize: s.fontSize || undefined,
      textColor: s.textColor || undefined,
    },
    borderRadius: s.borderRadius
      ? {topLeft: s.borderRadius, topRight: s.borderRadius, bottomRight: s.borderRadius, bottomLeft: s.borderRadius}
      : undefined,
    effects: {
      shadow: s.shadow || undefined,
      opacity: s.opacity ?? undefined,
    },
  }
}

function gridRow(
  layout: string,
  columns: Array<Record<string, unknown>>,
  opts?: {gap?: string; paddingY?: string; maxWidth?: string; backgroundColor?: string; blockStyles?: Record<string, unknown>},
) {
  const bg = opts?.backgroundColor
  const mergedBlockStyles = bg
    ? {...(opts?.blockStyles || {}), background: {color: bg}}
    : opts?.blockStyles

  return {
    _key: k(),
    _type: 'gridRow',
    layout,
    gap: opts?.gap || 'md',
    paddingY: opts?.paddingY || 'md',
    maxWidth: opts?.maxWidth || 'default',
    blockStyles: mergedBlockStyles,
    columns: columns.map((col) => ({_key: k(), _type: 'gridColumn', verticalAlign: 'top', ...col})),
  }
}

function heroSection(opts: {
  layout?: string
  badge?: string
  badgeLink?: string
  heading: string
  subtitle?: string
  alignment?: string
  buttons?: Array<Record<string, unknown>>
  backgroundType?: string
  backgroundColor?: string
  gradientFrom?: string
  gradientTo?: string
  gradientDirection?: string
  overlay?: number
  minHeight?: string
  textColor?: string
  maxWidth?: string
}) {
  return {
    _key: k(),
    _type: 'heroSection',
    layout: opts.layout || 'fullWidth',
    badge: opts.badge,
    badgeLink: opts.badgeLink,
    heading: opts.heading,
    subtitle: opts.subtitle,
    alignment: opts.alignment || 'center',
    buttons: opts.buttons,
    backgroundType: opts.backgroundType || 'color',
    backgroundColor: opts.backgroundColor,
    gradientFrom: opts.gradientFrom,
    gradientTo: opts.gradientTo,
    gradientDirection: opts.gradientDirection,
    overlay: opts.overlay,
    minHeight: opts.minHeight || '75vh',
    textColor: opts.textColor,
    maxWidth: opts.maxWidth || 'default',
  }
}

// ---------------------------------------------------------------------------
// Site Settings
// ---------------------------------------------------------------------------
const siteSettings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteName: 'PageCraft',
  tagline: 'Open-source page builder for Sanity + Astro',
  primaryColor: '#09090b',
  secondaryColor: '#18181b',
  footerStyle: 'dark',
  socialLinks: [
    {_key: k(), _type: 'socialLink', platform: 'github', url: 'https://github.com'},
    {_key: k(), _type: 'socialLink', platform: 'twitter', url: 'https://twitter.com'},
    {_key: k(), _type: 'socialLink', platform: 'linkedin', url: 'https://linkedin.com'},
  ],
  mainNav: [
    {_key: k(), _type: 'navLink', label: 'Features', href: '/showcase', isButton: false},
    {_key: k(), _type: 'navDropdown', label: 'Resources', items: [
      {_key: k(), label: 'Documentation', href: '/about', description: 'Learn how to use the page builder'},
      {_key: k(), label: 'Changelog', href: '/about', description: 'What\'s new in each release'},
    ]},
    {_key: k(), _type: 'navLink', label: 'About', href: '/about', isButton: false},
    {_key: k(), _type: 'navLink', label: 'Get Started', href: '/showcase', isButton: true},
  ],
  footerDescription:
    'The most complete open-source page builder for Sanity + Astro. Build any layout with 28+ content types and flexible grid rows.',
  footerColumns: [
    {
      _key: k(),
      _type: 'footerColumn',
      title: 'Product',
      links: [
        {_key: k(), _type: 'footerLink', label: 'Features', href: '/showcase'},
        {_key: k(), _type: 'footerLink', label: 'Changelog', href: '/about'},
      ],
    },
    {
      _key: k(),
      _type: 'footerColumn',
      title: 'Resources',
      links: [
        {_key: k(), _type: 'footerLink', label: 'GitHub', href: 'https://github.com'},
        {_key: k(), _type: 'footerLink', label: 'Sanity', href: 'https://sanity.io'},
        {_key: k(), _type: 'footerLink', label: 'Astro', href: 'https://astro.build'},
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------
const homePage = {
  _id: 'homePage',
  _type: 'homePage',
  seo: {
    metaTitle: 'PageCraft — Open-source Page Builder for Sanity + Astro',
    metaDescription: 'Build any page with 28+ content types, flexible grid layouts, and visual style controls. The most complete open-source page builder for Sanity.',
  },
  pageBuilder: [
    // Hero with gradient
    heroSection({
      badge: 'Open Source — MIT Licensed',
      badgeLink: 'https://github.com',
      heading: 'Build pages visually, ship them fast',
      subtitle: '28 content types. 9 layout presets. Visual style controls at every level. The page builder Sanity always deserved.',
      alignment: 'center',
      backgroundType: 'gradient',
      gradientFrom: '#fafafa',
      gradientTo: '#e4e4e7',
      gradientDirection: 'to bottom',
      minHeight: '75vh',
      buttons: [
        ctaButton('Get Started', '/showcase', 'primary'),
        extLink('View on GitHub', 'https://github.com', 'outline'),
      ],
    }),

    // Stats
    gridRow('25-25-25-25', [
      {
        verticalAlign: 'center',
        content: [{_key: k(), _type: 'statMetric', value: '28', label: 'Content Types', size: 'large'}],
        blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'}),
      },
      {
        verticalAlign: 'center',
        content: [{_key: k(), _type: 'statMetric', value: '9', label: 'Layout Presets', size: 'large'}],
        blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'}),
      },
      {
        verticalAlign: 'center',
        content: [{_key: k(), _type: 'statMetric', value: '16', label: 'Custom Inputs', size: 'large'}],
        blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'}),
      },
      {
        verticalAlign: 'center',
        content: [{_key: k(), _type: 'statMetric', value: '4', label: 'Button Variants', size: 'large'}],
        blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'}),
      },
    ], {paddingY: 'lg', backgroundColor: '#fafafa'}),

    // Feature Card Grid
    gridRow('full', [
      {
        content: [
          {
            _key: k(),
            _type: 'featureCardGrid',
            title: 'Everything you need to build pages',
            subtitle: 'A complete toolkit for content editors and developers alike.',
            columns: '3',
            style: 'bordered',
            cards: [
              {_key: k(), title: 'Flexible Grid System', description: '9 layout presets from full-width to 4-column. Nest any content type in any column. Control gap, padding, and alignment per row.'},
              {_key: k(), title: 'Visual Style Controls', description: 'Spacing, borders, backgrounds, typography, and effects at three levels — row, column, and block. No CSS required.'},
              {_key: k(), title: 'Hero Sections', description: 'Full-width or split layout heroes with gradient backgrounds, video support, badges, and dual CTA buttons.'},
              {_key: k(), title: 'Forms & FAQ', description: 'Contact forms with webhook integration and FAQ blocks with JSON-LD structured data for SEO.'},
              {_key: k(), title: 'Practice Areas', description: 'A page-builder layout for every practice area at its own URL, with SEO fields.'},
              {_key: k(), title: 'SEO Built-in', description: 'Meta titles, descriptions, OG images, and noindex controls on every page. Structured data for FAQ blocks.'},
            ],
            blockStyles: blockStyles({pt: '16px', pb: '16px'}),
          },
        ],
      },
    ], {paddingY: 'xl'}),

    // Testimonial
    gridRow('full', [
      {
        verticalAlign: 'center',
        content: [
          {
            _key: k(),
            _type: 'testimonialQuote',
            quote: 'This page builder saved us weeks of development time. The grid system is incredibly flexible and the custom Studio inputs make content editing a joy.',
            name: 'Alex Chen',
            title: 'Lead Developer',
            rating: 5,
            style: 'large',
          },
        ],
        blockStyles: blockStyles({pt: '40px', pb: '40px', textAlign: 'center'}),
      },
    ], {paddingY: 'lg', maxWidth: 'narrow', backgroundColor: '#fafafa'}),

    // FAQ
    gridRow('full', [
      {
        content: [
          {
            _key: k(),
            _type: 'faqBlock',
            title: 'Frequently Asked Questions',
            subtitle: 'Everything you need to know about the page builder.',
            enableSchema: true,
            allowMultipleOpen: true,
            firstOpenByDefault: true,
            items: [
              {_key: k(), question: 'What is this template?', answer: [textBlock('An open-source Sanity + Astro page builder with 28 content types, 9 layouts, and visual style controls. Everything you need to build production websites.')]},
              {_key: k(), question: 'Is it free to use?', answer: [textBlock('Yes — MIT licensed. Use it for personal or commercial projects without any restrictions.')]},
              {_key: k(), question: 'How do I customize the design?', answer: [textBlock('Every section has blockStyles for padding, margin, backgrounds, borders, typography and effects. You can also modify the Tailwind theme in globals.css.')]},
              {_key: k(), question: 'Can I add my own content types?', answer: [textBlock('Absolutely. Follow the pattern in src/sanity/schemaTypes/blocks/ for the schema and src/components/sections/content/ for the renderer. Register in blocks/index.ts and ContentRenderer.tsx.')]},
              {_key: k(), question: 'Does it support SEO?', answer: [textBlock('Yes. Every page and practice area has SEO fields (meta title, description, OG image, noindex). FAQ blocks output JSON-LD structured data.')]},
            ],
            blockStyles: blockStyles({pt: '8px', pb: '8px'}),
          },
        ],
      },
    ], {paddingY: 'xl', maxWidth: 'narrow'}),

    // CTA
    gridRow('full', [
      {
        verticalAlign: 'center',
        content: [
          {
            _key: k(),
            _type: 'richTextBlock',
            content: [
              textBlock('Ready to build?', 'h2'),
              textBlock('Clone the repo, run the seed script, and start building pages in minutes.'),
            ],
            blockStyles: blockStyles({textAlign: 'center', pb: '16px'}),
          },
          {
            _key: k(),
            _type: 'buttonGroup',
            direction: 'horizontal',
            alignment: 'center',
            gap: 'medium',
            buttons: [
              ctaButton('Open Studio', '/studio', 'primary'),
              extLink('GitHub', 'https://github.com', 'outline'),
            ],
          },
        ],
        blockStyles: blockStyles({pt: '48px', pb: '48px', textAlign: 'center'}),
      },
    ], {paddingY: 'lg', backgroundColor: '#fafafa'}),
  ],
}

// ---------------------------------------------------------------------------
// Showcase Page
// ---------------------------------------------------------------------------
const showcasePage = {
  _id: 'showcase-page',
  _type: 'page',
  title: 'Showcase',
  slug: {_type: 'slug', current: 'showcase'},
  seo: {
    metaTitle: 'Content Type Showcase — PageCraft',
    metaDescription: 'See all 28 content types in action. From heroes and forms to pricing cards and data tables.',
  },
  pageBuilder: [
    // Hero
    heroSection({
      heading: 'Content Type Showcase',
      subtitle: 'Every block type demonstrated on a single page. Copy these patterns to build your own layouts.',
      alignment: 'center',
      backgroundType: 'color',
      backgroundColor: '#fafafa',
      minHeight: '50vh',
    }),

    // Accordion + Tabs — 50/50
    gridRow('50-50', [
      {
        content: [
          {
            _key: k(),
            _type: 'accordion',
            title: 'Accordion',
            panels: [
              {_key: k(), title: 'What is this template?', content: [textBlock('An open-source Sanity + Astro page builder starter with 28 content types and flexible grid layouts.')]},
              {_key: k(), title: 'Is it free to use?', content: [textBlock('Yes! MIT licensed. Use it for personal or commercial projects.')]},
              {_key: k(), title: 'How do I customize it?', content: [textBlock('Add your own content types, modify existing ones, or adjust the Tailwind theme.')]},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '16px', pb: '16px'}),
      },
      {
        content: [
          {
            _key: k(),
            _type: 'tabbedContent',
            tabs: [
              {_key: k(), label: 'Astro', content: [textBlock('Built with Astro 7, shipping zero JavaScript by default.')]},
              {_key: k(), label: 'Sanity', content: [textBlock('Sanity Studio v5 with 16 custom visual input components.')]},
              {_key: k(), label: 'Tailwind', content: [textBlock('Tailwind CSS v4 with dark mode and custom tokens.')]},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '16px', pb: '16px'}),
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // Pricing — 3 columns
    gridRow('33-33-33', [
      {
        content: [
          {
            _key: k(),
            _type: 'pricingCard',
            title: 'Starter',
            price: '$0',
            priceSubtext: 'forever',
            features: [
              {_key: k(), text: '28 content types', included: true},
              {_key: k(), text: '9 layout presets', included: true},
              {_key: k(), text: 'Community support', included: true},
              {_key: k(), text: 'Priority support', included: false},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
      {
        content: [
          {
            _key: k(),
            _type: 'pricingCard',
            badge: 'Popular',
            title: 'Pro',
            price: '$29',
            priceSubtext: '/month',
            isHighlighted: true,
            features: [
              {_key: k(), text: 'Everything in Starter', included: true},
              {_key: k(), text: 'Priority support', included: true},
              {_key: k(), text: 'Custom integrations', included: true},
              {_key: k(), text: 'White-label', included: false},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
      {
        content: [
          {
            _key: k(),
            _type: 'pricingCard',
            title: 'Enterprise',
            price: 'Custom',
            priceSubtext: 'contact us',
            features: [
              {_key: k(), text: 'Everything in Pro', included: true},
              {_key: k(), text: 'White-label', included: true},
              {_key: k(), text: 'Dedicated support', included: true},
              {_key: k(), text: 'SLA guarantee', included: true},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
    ], {paddingY: 'xl'}),

    // Code block + Alerts — 66/33
    gridRow('66-33', [
      {
        content: [
          {
            _key: k(),
            _type: 'codeBlock',
            language: 'typescript',
            filename: 'page.ts',
            showLineNumbers: true,
            code: `import {defineType, defineField} from 'sanity'

export const pageType = defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug'}),
    defineField({name: 'pageBuilder', type: 'pageBuilder'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
})`,
          },
        ],
      },
      {
        content: [
          {_key: k(), _type: 'alertNotice', type: 'info', title: 'Info', message: 'This is an informational alert.'},
          {_key: k(), _type: 'alertNotice', type: 'success', title: 'Success', message: 'Operation completed.'},
          {_key: k(), _type: 'alertNotice', type: 'warning', title: 'Warning', message: 'Please review before continuing.'},
          {_key: k(), _type: 'alertNotice', type: 'error', title: 'Error', message: 'Something went wrong.'},
        ],
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // Form Block
    gridRow('full', [
      {
        content: [
          {
            _key: k(),
            _type: 'formBlock',
            formTitle: 'Get in Touch',
            formDescription: 'Fill out the form and we\'ll get back to you within 24 hours.',
            submitLabel: 'Send Message',
            submitAction: 'webhook',
            successMessage: 'Thanks! We\'ll be in touch soon.',
            errorMessage: 'Something went wrong. Please try again.',
            fields: [
              {_key: k(), label: 'Name', name: 'name', type: 'text', placeholder: 'Your name', required: true, width: 'half'},
              {_key: k(), label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', required: true, width: 'half'},
              {_key: k(), label: 'Subject', name: 'subject', type: 'select', placeholder: 'Select a topic', required: true, width: 'full', options: ['General Inquiry', 'Bug Report', 'Feature Request', 'Partnership']},
              {_key: k(), label: 'Message', name: 'message', type: 'textarea', placeholder: 'Tell us more...', required: true, width: 'full'},
              {_key: k(), label: 'I agree to the terms', name: 'terms', type: 'checkbox', required: true, width: 'full'},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '32px', pb: '32px', pl: '24px', pr: '24px', bgColor: '#fafafa', borderRadius: '16px'}),
      },
    ], {paddingY: 'xl', maxWidth: 'narrow'}),

    // Countdown + Data Table
    gridRow('50-50', [
      {
        verticalAlign: 'center',
        content: [
          {
            _key: k(),
            _type: 'countdownTimer',
            title: 'Launch Countdown',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            expiredMessage: 'We have launched!',
          },
        ],
        blockStyles: blockStyles({pt: '24px', pb: '24px'}),
      },
      {
        content: [
          {
            _key: k(),
            _type: 'dataTable',
            caption: 'Feature Comparison',
            striped: true,
            headers: [
              {_key: k(), text: 'Feature'},
              {_key: k(), text: 'Starter'},
              {_key: k(), text: 'Pro'},
            ],
            rows: [
              {_key: k(), cells: [{_key: k(), text: 'Content Types'}, {_key: k(), text: '28'}, {_key: k(), text: '28'}]},
              {_key: k(), cells: [{_key: k(), text: 'Layouts'}, {_key: k(), text: '9'}, {_key: k(), text: '9'}]},
              {_key: k(), cells: [{_key: k(), text: 'Support'}, {_key: k(), text: 'Community'}, {_key: k(), text: 'Priority'}]},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // Stats row
    gridRow('33-33-33', [
      {verticalAlign: 'center', content: [{_key: k(), _type: 'statMetric', prefix: '$', value: '2.4M', label: 'Revenue Generated', size: 'medium'}], blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'})},
      {verticalAlign: 'center', content: [{_key: k(), _type: 'statMetric', value: '99.9', suffix: '%', label: 'Uptime', size: 'medium'}], blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'})},
      {verticalAlign: 'center', content: [{_key: k(), _type: 'statMetric', prefix: '', value: '50K+', label: 'Active Users', size: 'medium'}], blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'})},
    ], {paddingY: 'lg', backgroundColor: '#fafafa'}),

    // Testimonial Carousel
    gridRow('full', [
      {
        content: [
          {
            _key: k(),
            _type: 'testimonialCarousel',
            title: 'What developers say',
            autoPlay: true,
            autoPlayInterval: 6,
            showDots: true,
            showArrows: true,
            testimonials: [
              {_key: k(), _type: 'testimonialQuote', quote: 'The grid system is incredibly flexible. We built our entire marketing site in a single afternoon.', name: 'Sarah Miller', title: 'Frontend Lead', rating: 5, style: 'card'},
              {_key: k(), _type: 'testimonialQuote', quote: 'Finally a Sanity template that doesn\'t make me write CSS for every section. The blockStyles system is genius.', name: 'David Park', title: 'Freelance Developer', rating: 5, style: 'card'},
              {_key: k(), _type: 'testimonialQuote', quote: 'Our content team loves the visual Studio inputs. They can build landing pages without touching code.', name: 'Maria Rodriguez', title: 'Head of Marketing', rating: 5, style: 'card'},
            ],
          },
        ],
        blockStyles: blockStyles({pt: '16px', pb: '16px'}),
      },
    ], {paddingY: 'xl'}),

    // Icon + Text — 3 columns
    gridRow('33-33-33', [
      {
        content: [{
          _key: k(),
          _type: 'iconText',
          title: 'Flexible Layouts',
          description: '9 grid presets from full-width to 4-column. Nest any content type in any column.',
          iconSize: 'medium',
          alignment: 'center',
        }],
        blockStyles: blockStyles({pt: '16px', pb: '16px', textAlign: 'center'}),
      },
      {
        content: [{
          _key: k(),
          _type: 'iconText',
          title: 'Type Safe',
          description: 'Auto-generated TypeScript types from Sanity schemas. Full type inference for GROQ queries.',
          iconSize: 'medium',
          alignment: 'center',
        }],
        blockStyles: blockStyles({pt: '16px', pb: '16px', textAlign: 'center'}),
      },
      {
        content: [{
          _key: k(),
          _type: 'iconText',
          title: 'Visual Editing',
          description: 'Real-time preview and visual editing with the Sanity Presentation tool.',
          iconSize: 'medium',
          alignment: 'center',
        }],
        blockStyles: blockStyles({pt: '16px', pb: '16px', textAlign: 'center'}),
      },
    ], {paddingY: 'lg'}),

    // Feature Card Grid
    gridRow('full', [
      {
        content: [{
          _key: k(),
          _type: 'featureCardGrid',
          title: 'Built for developers and editors',
          subtitle: 'A complete toolkit that lets content editors build pages without developer intervention.',
          columns: '3',
          style: 'bordered',
          cards: [
            {_key: k(), title: 'Grid System', description: '9 layout presets from full-width to 4-column. Control gap, padding, and alignment per row.'},
            {_key: k(), title: 'Visual Controls', description: 'Spacing, borders, backgrounds, typography, and effects at three levels — row, column, and block.'},
            {_key: k(), title: 'Practice Areas', description: 'A page-builder layout for every practice area at its own URL, with SEO fields.'},
            {_key: k(), title: 'Forms & FAQ', description: 'Contact forms with webhook integration and FAQ blocks with JSON-LD structured data.'},
            {_key: k(), title: 'SEO Built-in', description: 'Meta titles, descriptions, OG images, and noindex on every page. FAQ blocks output JSON-LD.'},
            {_key: k(), title: '16 Custom Inputs', description: 'Visual Studio inputs for spacing, borders, backgrounds, typography, layouts, and more.'},
          ],
          blockStyles: blockStyles({pt: '16px', pb: '16px'}),
        }],
      },
    ], {paddingY: 'xl'}),

    // Video — YouTube + External
    gridRow('50-50', [
      {
        content: [{
          _key: k(),
          _type: 'youtubeVideo',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          caption: 'YouTube embed with automatic aspect ratio',
        }],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
      {
        content: [{
          _key: k(),
          _type: 'externalVideo',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          caption: 'Self-hosted MP4 with autoplay and loop controls',
          autoplay: false,
          loop: false,
          muted: true,
        }],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // FAQ Block
    gridRow('full', [
      {
        content: [{
          _key: k(),
          _type: 'faqBlock',
          title: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about PageCraft.',
          enableSchema: true,
          allowMultipleOpen: true,
          firstOpenByDefault: true,
          items: [
            {_key: k(), question: 'What is PageCraft?', answer: [textBlock('An open-source Sanity + Astro page builder with 28 content types, 9 layouts, and visual style controls. Everything you need to build production websites.')]},
            {_key: k(), question: 'Is it free to use?', answer: [textBlock('Yes — MIT licensed. Use it for personal or commercial projects without any restrictions.')]},
            {_key: k(), question: 'How do I customize the design?', answer: [textBlock('Every section has blockStyles for padding, margin, backgrounds, borders, typography and effects. You can also modify the Tailwind theme in globals.css.')]},
            {_key: k(), question: 'Can I add my own content types?', answer: [textBlock('Absolutely. Follow the pattern in schemaTypes/blocks/ for the schema and components/sections/content/ for the renderer. Register in blocks/index.ts and ContentRenderer.tsx.')]},
            {_key: k(), question: 'Does it support SEO?', answer: [textBlock('Yes. Every page and practice area has SEO fields (meta title, description, OG image, noindex). FAQ blocks output JSON-LD structured data for Google.')]},
          ],
          blockStyles: blockStyles({pt: '8px', pb: '8px'}),
        }],
      },
    ], {paddingY: 'xl', maxWidth: 'narrow'}),

    // Social Embed + Map Embed
    gridRow('50-50', [
      {
        content: [{
          _key: k(),
          _type: 'socialEmbed',
          platform: 'twitter',
          embedUrl: 'https://twitter.com/sanaborz/status/1234567890',
          caption: 'Embed posts from Twitter/X, Instagram, TikTok, and Facebook',
          aspectRatio: 'auto',
        }],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
      {
        content: [{
          _key: k(),
          _type: 'mapEmbed',
          embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.991625819824!2d2.292292615674!3d48.858370079287!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sfr!4v1234567890',
          height: 'large',
          caption: 'Google Maps with configurable height and rounded corners',
          style: 'rounded',
        }],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // Lottie Animation
    gridRow('50-50', [
      {
        verticalAlign: 'center',
        content: [{
          _key: k(),
          _type: 'lottieAnimation',
          source: 'url',
          url: 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie',
          autoplay: true,
          loop: true,
          speed: 1,
          trigger: 'auto',
          alt: 'Animated illustration',
        }],
        blockStyles: blockStyles({pt: '16px', pb: '16px'}),
      },
      {
        verticalAlign: 'center',
        content: [{
          _key: k(),
          _type: 'richTextBlock',
          content: [
            textBlock('Lottie Animations', 'h3'),
            textBlock('Embed lightweight vector animations from LottieFiles or upload your own JSON files. Support for autoplay, loop, speed control, and scroll-triggered playback.'),
          ],
          blockStyles: blockStyles({pt: '16px', pb: '16px'}),
        }],
      },
    ], {gap: 'lg', paddingY: 'lg'}),

    // Table of Contents
    gridRow('full', [
      {
        content: [{
          _key: k(),
          _type: 'tocBlock',
          title: 'Table of Contents',
        }],
        blockStyles: blockStyles({pt: '16px', pb: '16px'}),
      },
    ], {paddingY: 'md', maxWidth: 'narrow'}),

    // Final CTA
    gridRow('full', [
      {
        verticalAlign: 'center',
        content: [
          {_key: k(), _type: 'spacerDivider', height: 'sm', showDivider: true, dividerStyle: 'solid', dividerColor: '#e4e4e7'},
          {
            _key: k(),
            _type: 'richTextBlock',
            content: [
              textBlock('Ready to build?', 'h3'),
              textBlock('Open the Studio to start creating pages with the grid-based page builder.'),
            ],
            blockStyles: blockStyles({textAlign: 'center', pt: '16px', pb: '16px'}),
          },
          {
            _key: k(),
            _type: 'buttonGroup',
            direction: 'horizontal',
            alignment: 'center',
            gap: 'medium',
            buttons: [
              ctaButton('Open Studio', '/studio', 'primary'),
              extLink('View on GitHub', 'https://github.com', 'outline'),
            ],
          },
        ],
        blockStyles: blockStyles({pt: '32px', pb: '32px', textAlign: 'center'}),
      },
    ], {paddingY: 'lg', maxWidth: 'narrow'}),
  ],
}

// ---------------------------------------------------------------------------
// About Page
// ---------------------------------------------------------------------------
const aboutPage = {
  _id: 'about-page',
  _type: 'page',
  title: 'About',
  slug: {_type: 'slug', current: 'about'},
  seo: {
    metaTitle: 'About — PageCraft',
    metaDescription: 'Learn about the most complete open-source page builder for Sanity + Astro.',
  },
  pageBuilder: [
    heroSection({
      heading: 'About PageCraft',
      subtitle: 'An open-source page builder that gives you the most complete set of content types and layout controls for Sanity + Astro.',
      alignment: 'center',
      backgroundType: 'color',
      backgroundColor: '#fafafa',
      minHeight: '50vh',
    }),

    gridRow('66-33', [
      {
        content: [
          {
            _key: k(),
            _type: 'richTextBlock',
            content: [
              textBlock('How it works', 'h2'),
              textBlock('Every page is built from Grid Rows. Each row has a layout preset (from full-width to 4-column) and each column can contain any of 28 content types.'),
              textBlock('Visual style controls (spacing, border, background, typography, effects) are available at three levels — the grid row, the column, and the individual content block — giving you pixel-perfect control without writing CSS.'),
              textBlock('The philosophy', 'h3'),
              textBlock('We believe content editors should be able to build any page layout without developer intervention. At the same time, developers should have clean, typed code that\'s easy to extend.'),
            ],
            blockStyles: blockStyles({pb: '16px'}),
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
      {
        content: [
          {_key: k(), _type: 'alertNotice', type: 'info', title: 'Tech Stack', message: 'Astro 7 • Sanity v5 • Tailwind CSS v4 • TypeScript'},
          {
            _key: k(),
            _type: 'testimonialQuote',
            quote: 'The best page builder template I have found for Sanity. Period.',
            name: 'Sarah Johnson',
            title: 'Freelance Developer',
            rating: 5,
            style: 'card',
          },
        ],
        blockStyles: blockStyles({pt: '8px', pb: '8px'}),
      },
    ], {paddingY: 'xl', gap: 'xl'}),
  ],
}

// ---------------------------------------------------------------------------
// Practice Area
// ---------------------------------------------------------------------------
const practiceArea = {
  _id: 'practice-area-getting-started',
  _type: 'practiceArea',
  title: 'Getting Started with PageCraft',
  slug: {_type: 'slug', current: 'getting-started'},
  pageBuilder: [
    gridRow('full', [
      {
        content: [
          {
            _key: k(),
            _type: 'richTextBlock',
            content: [
              textBlock('Getting Started', 'h2'),
              textBlock('PageCraft is built on top of Sanity and Astro. To get started, clone the repo, install dependencies, and run the development server.'),
              textBlock('Prerequisites', 'h3'),
              textBlock('You\'ll need Node.js 18+, a Sanity account, and basic familiarity with React and TypeScript.'),
              textBlock('How the Page Builder Works', 'h2'),
              textBlock('Every page is composed of sections. Each section is either a Hero Section (full-width, at the top of a page) or a Grid Row (flexible column layout). Grid Rows support 9 layout presets from full-width to 4-column.'),
              textBlock('Content Types', 'h3'),
              textBlock('Each grid column can contain any of 28 content types: rich text, images, CTAs, forms, FAQs, pricing cards, testimonials, feature grids, galleries, code blocks, and more.'),
              textBlock('Visual Style Controls', 'h2'),
              textBlock('The blockStyles system gives you padding, margin, border, background, typography, and effects controls at three levels: the grid row, the column, and the individual block.'),
              textBlock('This means content editors can adjust spacing and visual appearance without touching code — just expand the Block Styles section in the Studio.'),
              textBlock('Next Steps', 'h2'),
              textBlock('Open the Studio at /studio and start building. Check the showcase page at /showcase to see all content types in action.'),
            ],
          },
        ],
      },
    ], {paddingY: 'lg', maxWidth: 'narrow'}),
  ],
  seo: {
    metaTitle: 'Getting Started with PageCraft',
    metaDescription: 'Learn how to set up and customize the most complete open-source page builder for Sanity + Astro.',
  },
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  console.log('Seeding demo data...')

  const transaction = client.transaction()
  transaction.createOrReplace(siteSettings)
  transaction.createOrReplace(homePage)
  transaction.createOrReplace(showcasePage)
  transaction.createOrReplace(aboutPage)
  transaction.createOrReplace(practiceArea)

  const result = await transaction.commit()
  console.log(`Done! Created ${result.documentIds.length} documents:`)
  result.documentIds.forEach((id: string) => console.log(`  - ${id}`))
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
