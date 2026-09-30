import {defineQuery} from 'groq'

/**
 * A document in the requested language ($language). Documents from before
 * languages existed have none and count as the default, English — keep "en"
 * in step with DEFAULT_LANGUAGE in lib/i18n.ts.
 */
const LANGUAGE_MATCHES = /* groq */ `coalesce(language, "en") == $language`

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

// Internal links store a bare reference; the href needs the target's slug,
// and its language for the /es/ prefix. On a page in another language
// ($language), a link to a page that has a version in that language goes to
// that version (the English About Us from a Spanish page -> /es/acerca-nosotros);
// without one it goes to the page picked. Parenthesised so the language filter
// runs on the list of versions, not on each one.
const linkFragment = /* groq */ `
  link[] {
    ...,
    _type == "linkInternal" => {
      "reference": coalesce(
        (*[_type == "translation.metadata" && references(^.reference._ref)][0].translations[].value->)
          [coalesce(language, "en") == $language][0]{ slug, language },
        reference->{ slug, language }
      )
    }
  }
`

// Everything a news card shows. Shared by the News Cards block and /news, so
// the card reads the same data wherever it appears.
const newsCardFragment = /* groq */ `
  _id, title, "slug": slug.current, publishedAt,
  "category": category->title,
  coverImage { ${imageFragment} }
`

// Everything a practice area card shows. Shared by the Practice Area Cards
// block (picked or all) and PRACTICE_AREAS_QUERY, so the card reads the same
// data wherever it appears.
const practiceAreaCardFragment = /* groq */ `
  _id, title, cardTitle, slug, language,
  coverImage { ${imageFragment} }
`

// Both practice-area blocks: the picked ones in their picked order, or —
// nothing picked — every practice area in the page's language ($language)
// A–Z, so a new one appears without editing the block. Placed after the
// spread, it replaces the bare references.
const practiceAreasPickedOrAllFragment = /* groq */ `
  "practiceAreas": select(
    count(practiceAreas) > 0 => practiceAreas[]-> { ${practiceAreaCardFragment} },
    *[_type == "practiceArea" && defined(slug.current) && ${LANGUAGE_MATCHES}]
      | order(title asc) { ${practiceAreaCardFragment} }
  )
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

// A review in the page's language: on Spanish pages the Spanish title and
// text when there are ones. The client's name and the rating are shared.
const reviewFragment = /* groq */ `
  _id, clientName, rating,
  "title": select($language == "es" => coalesce(titleEs, title), title),
  "reviewText": select($language == "es" => coalesce(reviewTextEs, reviewText), reviewText)
`

// A form's fields. A select set to "Practice Areas" gets every practice area's
// title A–Z as its options, in the page's language — or English, while there
// are no practice areas in it yet — instead of the ones typed in.
const PRACTICE_AREA_TITLES = (language: string) => /* groq */ `
  (*[_type == "practiceArea" && defined(title) && coalesce(language, "en") == ${language}]
    | order(title asc))[].title
`
const formFieldsFragment = /* groq */ `
  fields[] {
    ...,
    "options": select(
      optionsSource == "practiceAreas"
        && count(*[_type == "practiceArea" && coalesce(language, "en") == $language]) > 0
        => ${PRACTICE_AREA_TITLES('$language')},
      optionsSource == "practiceAreas" => ${PRACTICE_AREA_TITLES('"en"')},
      options
    )
  }
`

// Per-type projections for the blocks in a column.
const contentTypesFragment = /* groq */ `
    _type == "imageBlock" => {
      image { ${imageFragment} },
      caption,
      priority,
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
    // Reviews live in their own documents. Picked ones keep the editor's order;
    // an empty pick means every review, newest first. The computed "reviews"
    // comes after the spread, so it replaces the bare references.
    _type == "testimonialCarousel" => {
      ...,
      "reviews": select(
        count(reviews) > 0 => reviews[]-> { ${reviewFragment} },
        *[_type == "review"] | order(_createdAt desc) { ${reviewFragment} }
      ),
      ${blockStylesFragment}
    },
    _type == "lawyerCards" => {
      ...,
      // On a Spanish page, the Spanish role and bio when there are ones.
      lawyers[]-> {
        _id, name,
        "role": select($language == "es" => coalesce(roleEs, role), role),
        "shortBio": select($language == "es" => coalesce(shortBioEs, shortBio), shortBio),
        "slug": slug.current,
        photo { ${imageFragment} }
      },
      ${blockStylesFragment}
    },
    // A picked Form CTA document; older blocks carry their own content, which
    // the spread keeps for the component to fall back on.
    _type == "formBlock" => { ${formFieldsFragment} },
    // Picked pages in their order, or every practice area in the page's
    // language A–Z.
    _type == "linkList" => {
      ...,
      "links": select(
        source == "manual" => items[]-> { _id, title, "slug": slug.current, language },
        *[_type == "practiceArea" && defined(slug.current) && ${LANGUAGE_MATCHES}]
          | order(title asc) { _id, title, "slug": slug.current, language }
      ),
      ${blockStylesFragment}
    },
    _type == "formCta" => {
      ...,
      // The picked CTA, or on a Spanish page its Spanish translation when
      // there is one (^ is the block, so ^.cta is the picked reference).
      "cta": coalesce(
        select($language != "en" =>
          *[_type == "translation.metadata" && references(^.cta._ref)][0]
            .translations[language == $language][0].value-> {
              ..., image { ${imageFragment} }, form { ..., ${formFieldsFragment} }
            }
        ),
        cta-> { ..., image { ${imageFragment} }, form { ..., ${formFieldsFragment} } }
      ),
      image { ${imageFragment} },
      ${blockStylesFragment}
    },
    _type == "caseResultCards" => {
      ...,
      // On a Spanish page, the Spanish summary when there is one.
      caseResults[]-> {
        _id, amount, resultType,
        "summary": select($language == "es" => coalesce(summaryEs, summary), summary)
      },
      ${blockStylesFragment}
    },
    // Two conditions sharing one fragment, not one _type in [...] check:
    // TypeGen only narrows ==, and with in it typed practiceAreas as possibly
    // the bare references the spread brings in.
    _type == "practiceAreaCards" => {
      ...,
      ${practiceAreasPickedOrAllFragment},
      ${blockStylesFragment}
    },
    _type == "practiceAreaGrid" => {
      ...,
      ${practiceAreasPickedOrAllFragment},
      ${blockStylesFragment}
    },
    // Picked posts in their picked order, or the newest ones — optionally from
    // one category (^ is the block, so ^.category is its own filter). GROQ
    // can't slice by a field, so it takes 24 and the component keeps "count".
    _type == "newsCards" => {
      ...,
      "posts": select(
        source == "manual" => newsPosts[]-> { ${newsCardFragment} },
        *[_type == "newsPost" && defined(slug.current)
          && (!defined(^.category) || category._ref == ^.category._ref)]
          | order(publishedAt desc) [0...24] { ${newsCardFragment} }
      ),
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
        ${linkFragment},
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
      ${linkFragment},
      ${contentFragment},
      ${blockStylesFragment}
    },
    ${blockStylesFragment}
  }
`

// The Home Page in a language: homePage in English, homePage-es in Spanish
// (its translation, studio languages.ts). "translations" lists which
// languages have one, for the header's language link and hreflang.
export const HOME_PAGE_QUERY = defineQuery(/* groq */ `
  *[_type == "homePage" && ${LANGUAGE_MATCHES}][0] {
    _id, _type, language,
    "translations": *[_type == "translation.metadata" && references(^._id)][0]
      .translations[].value->{ language },
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

// Pages and practice areas share the root (/<slug>, or /es/<slug>); the
// Studio keeps their slugs unique across both types within a language.
// "translations" is the same page in the other languages, for the header's
// language link and the hreflang tags.
export const PAGE_QUERY = defineQuery(/* groq */ `
  *[_type in ["page", "practiceArea"] && slug.current == $slug && ${LANGUAGE_MATCHES}][0] {
    _id, _type, title, slug, language,
    "translations": *[_type == "translation.metadata" && references(^._id)][0]
      .translations[].value->{ language, "slug": slug.current },
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

export const PAGE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type in ["page", "practiceArea"] && defined(slug.current)] {
    "slug": slug.current, language
  }
`)

export const PRACTICE_AREAS_QUERY = defineQuery(/* groq */ `
  *[_type == "practiceArea" && defined(slug.current) && ${LANGUAGE_MATCHES}]
    | order(title asc) {
    ${practiceAreaCardFragment}
  }
`)

/**
 * The site's phone from Site Settings, for inline rich text and Phone blocks,
 * with the Spanish settings' label and Main Phone Text for Spanish pages.
 */
export const SITE_INFO_QUERY = defineQuery(/* groq */ `{
  "en": *[_id == "siteSettings"][0] {
    phone, "phoneText": footerPhoneText, "phoneLabel": footerPhoneLabel,
    "phoneTexts": phoneTexts[] { _key, text }
  },
  "es": *[_id == "siteSettingsEs"][0] { "phoneText": footerPhoneText, "phoneLabel": footerPhoneLabel }
}`)

// Site Settings fields whose words change with the language. Shared by the
// English settings and the Spanish ones (studio site-settings-es.ts), so both
// come back in the same shape and the Spanish can fill in over the English.
const siteTextFragment = /* groq */ `
  tagline,
  mainNav[] {
    _key, _type, label, href, isButton,
    _type == "navDropdown" => {
      items[] { _key, label, href, description, icon { ${imageFragment} } }
    }
  },
  searchHeading, searchPlaceholder,
  headerExtraLink { label, href },
  footerPhoneLabel, footerPhoneText,
  footerNav[] { _key, label, href },
  footerOffices[] { _key, name, address, directionsUrl },
  footerDisclaimerTitle, footerDisclaimer, footerCopyright,
  footerLegalLinks[] { _key, label, href }
`

export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0] {
    siteName,
    logo { ${imageFragment} },
    phone,
    theme {
      primary, secondary, accent, foreground, background, muted, border,
      headingFont, bodyFont
    },
    socialLinks[] { _key, platform, url },
    headerSearch,
    footerLogo { ${imageFragment} },
    ${siteTextFragment}
  }
`)

/** The Spanish words for the header, menus and footer on /es/ pages. */
export const SITE_SETTINGS_ES_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettingsEs"][0] {
    ${siteTextFragment}
  }
`)

/**
 * Each set of pages that are translations of one another, as language + slug,
 * so a menu link to an English page can switch to its Spanish version.
 */
export const PAGE_TRANSLATIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "translation.metadata"] {
    "pages": translations[].value->{ language, "slug": slug.current }
  }
`)

export const NEWS_LIST_QUERY = defineQuery(/* groq */ `
  *[_type == "newsPost" && defined(slug.current)] | order(publishedAt desc) {
    ${newsCardFragment}
  }
`)

export const NEWS_POST_QUERY = defineQuery(/* groq */ `
  *[_type == "newsPost" && slug.current == $slug][0] {
    _id, _type, title, "slug": slug.current, publishedAt, excerpt,
    "category": category->title,
    coverImage { ${imageFragment} },
    ${seoFragment},
    ${pageBuilderFragment}
  }
`)

// Site search. $terms is the query split into words, each with a trailing *
// so "acci" finds "accident"; every word must match, but they can come from
// different fields — the array is matched as one bag of words. Besides the
// visible text it searches the slug's words (new-york-car-accident-lawyer)
// and the type's name, so "practice areas" finds every practice area and
// "news" every post. Titles rank first. Pages and practice areas live at
// /<slug>, news at /news/<slug>.
export const SEARCH_QUERY = defineQuery(/* groq */ `
  *[_type in ["page", "practiceArea", "newsPost"] && defined(slug.current)
    && [
      title, cardTitle, excerpt, seo.metaDescription, slug.current,
      select(_type == "practiceArea" => "practice areas", _type == "newsPost" => "news", "")
    ] match $terms]
  | score(boost(title match $terms, 3), boost(cardTitle match $terms, 2), excerpt match $terms)
  | order(_score desc) [0...30] {
    _id, _type, title, "slug": slug.current, language, excerpt, publishedAt
  }
`)
