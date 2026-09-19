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
    typography, effects, motion
  }
`

const seoFragment = /* groq */ `
  seo {
    metaTitle, metaDescription, noIndex,
    ogImage { asset->{ _id, url } }
  }
`

const heroFragment = /* groq */ `
  _type == "heroSection" => {
    ...,
    buttons[] { _key, _type, ..., ${blockStylesFragment} },
    mediaImage { ${imageFragment} },
    backgroundImage { ${imageFragment} },
    ${blockStylesFragment}
  }
`

const contentFragment = /* groq */ `
  content[] {
    _key, _type, ...,
    _type == "imageBlock" => {
      image { ${imageFragment} },
      caption,
      ${blockStylesFragment}
    },
    _type == "richTextBlock" => {
      content[] { ... },
      ${blockStylesFragment}
    },
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

export const PAGE_QUERY = defineQuery(/* groq */ `
  *[_type == "page" && slug.current == $slug][0] {
    _id, _type, title, slug,
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

export const PAGE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "page" && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const BLOG_POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt, author,
    coverImage { ${imageFragment} },
    ${seoFragment}
  }
`)

export const BLOG_POST_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, excerpt, publishedAt, author,
    coverImage { ${imageFragment} },
    body[] { ... },
    ${seoFragment}
  }
`)

export const BLOG_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && defined(slug.current)] {
    "slug": slug.current
  }
`)

export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0] {
    siteName, tagline,
    logo { ${imageFragment} },
    phone,
    primaryColor, secondaryColor,
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
