import {defineQuery} from 'groq'

const imageFragment = /* groq */ `
  asset->{
    _id,
    url,
    metadata { lqip, dimensions { width, height } }
  },
  alt,
  hotspot,
  crop
`

const blockStylesFragment = /* groq */ `
  blockStyles {
    padding, margin, size, border, borderRadius,
    background { color, image { ${imageFragment} }, size, overlay },
    typography, effects, motion,
    cssId, cssClasses, customCss
  }
`

const seoFragment = /* groq */ `
  seo {
    metaTitle, metaDescription, noIndex,
    ogImage { asset->{ _id, url } }
  }
`

// Internal links store a bare reference; the href needs the target's slug.
const linkFragment = /* groq */ `
  link[] {
    ...,
    _type == "linkInternal" => { "reference": reference->{ slug } }
  }
`

const heroFragment = /* groq */ `
  _type == "heroSection" => {
    ...,
    buttons[] { _key, _type, ..., ${linkFragment}, ${blockStylesFragment} },
    mediaImage { ${imageFragment} },
    backgroundImage { ${imageFragment} },
    ${blockStylesFragment}
  }
`

// Per-type projections for the blocks in a column.
const contentTypesFragment = /* groq */ `
    _type == "imageBlock" => {
      image { ${imageFragment} },
      caption,
      ${blockStylesFragment}
    },
    _type == "richTextBlock" => {
      // Inline images need their asset dereferenced, or SanityImage has no
      // dimensions and falls back to a default aspect ratio.
      content[] {
        ...,
        _type == "image" => { ${imageFragment} },
        _type == "callToAction" => { ${linkFragment} }
      },
      ${blockStylesFragment}
    },
    _type == "callToAction" => { ${linkFragment} },
    _type == "buttonGroup" => { buttons[] { ..., ${linkFragment} } },
    _type == "pricingCard" => { cta { ..., ${linkFragment} } },
    _type == "logoRow" => {
      logos[] { image { ${imageFragment} }, alt, link },
      grayscale, size,
      ${blockStylesFragment}
    },
    _type == "testimonialQuote" => {
      ...,
      avatar { ${imageFragment} },
      ${blockStylesFragment}
    },
    _type == "iconText" => {
      ...,
      icon { ${imageFragment} },
      ${blockStylesFragment}
    },
    _type == "lawyerCards" => {
      ...,
      lawyers[]-> {
        _id, name, role, shortBio,
        "slug": slug.current,
        photo { ${imageFragment} }
      },
      ${blockStylesFragment}
    },
    _type == "caseResultCards" => {
      ...,
      caseResults[]-> {
        _id, amount, summary, resultType
      },
      ${blockStylesFragment}
    }
`

// An Inner Container's own columns. No Inner Container case here: the schema
// stops nesting at one level, and GROQ can't recurse past what's written out.
const innerContentFragment = /* groq */ `
  content[] {
    _key, _type, ...,
    ${contentTypesFragment},
    ${blockStylesFragment}
  }
`

const contentFragment = /* groq */ `
  content[] {
    _key, _type, ...,
    ${contentTypesFragment},
    _type == "nestedContainer" => {
      columns[] {
        _key, ...,
        ${innerContentFragment},
        ${blockStylesFragment}
      }
    },
    ${blockStylesFragment}
  }
`

const pageBuilderFragment = /* groq */ `
  pageBuilder[] {
    _key, _type, ...,
    ${heroFragment},
    columns[] {
      _key, ...,
      ${contentFragment},
      ${blockStylesFragment}
    },
    ${blockStylesFragment}
  }
`

export const HOME_PAGE_QUERY = defineQuery(/* groq */ `
  *[_id == "homePage"][0] {
    _id, _type,
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

// Pages and practice areas share the root (/<slug>); the Studio keeps their
// slugs unique across both types.
export const PAGE_QUERY = defineQuery(/* groq */ `
  *[_type in ["page", "practiceArea"] && slug.current == $slug][0] {
    _id, _type, title, slug,
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

export const PAGE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type in ["page", "practiceArea"] && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const PRACTICE_AREAS_QUERY = defineQuery(/* groq */ `
  *[_type == "practiceArea" && defined(slug.current)] | order(title asc) {
    _id, title, slug,
    coverImage { ${imageFragment} }
  }
`)

export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0] {
    siteName, tagline,
    logo { ${imageFragment} },
    phone,
    theme {
      primary, secondary, accent, foreground, background, muted, border,
      headingFont, bodyFont
    },
    socialLinks[] { _key, platform, url },
    mainNav[] {
      _key, _type, label, href, isButton,
      _type == "navDropdown" => {
        items[] { _key, label, href, description, icon { ${imageFragment} } }
      }
    },
    footerStyle,
    footerDescription,
    footerColumns[] {
      _key, title,
      links[] { _key, label, href }
    }
  }
`)
