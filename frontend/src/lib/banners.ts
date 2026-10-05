/**
 * The CTA Banners built into the site, in English and Spanish. The CTA Banner
 * block picks one by its key; editors don't fill anything in. Adding one: an
 * entry here, and the same key in the Studio's list
 * (studio/schemaTypes/blocks/cta-banner.ts).
 */
import type {Language} from './i18n'

export interface BannerWords {
  heading: string
  text: string
  /** The button's words; the button is left out without them. */
  buttonLabel?: string
  /** Where the button goes: a site path ("/contact-us") or a full URL. */
  buttonHref?: string
}

export interface Banner {
  /**
   * A file in public/, by its path on the site, and the part to keep in view
   * as the box crops it (a CSS object-position, e.g. "40% 30%"; the middle by
   * default).
   */
  image?: {src: string; alt: Record<Language, string>; position?: string}
  /** The blue line along the bottom. */
  showLine: boolean
  words: Record<Language, BannerWords>
}

export const BANNERS: Record<string, Banner> = {
  'we-have-your-back': {
    image: {
      src: '/assets/images/statue-of-lady-justice-with-scales-of-justice.webp',
      alt: {en: 'Statue of Lady Justice holding the scales of justice', es: 'Estatua de la Justicia sosteniendo la balanza'},
    },
    showLine: true,
    words: {
      en: {
        heading: 'We Have Your Back',
        text: 'Founded in 1967, The Sanders Law Firm has grown into a large, thriving organization of attorneys, paralegals, medical consultants, and support staff – all committed to providing the highest level of legal representation to injured New Yorkers.',
        buttonLabel: 'Get Help Now',
        buttonHref: '/contact-us/',
      },
      es: {
        heading: 'Lo Respaldamos en Todo Momento',
        text: 'Fundado en 1967, The Sanders Law Firm se ha convertido en una organización sólida y consolidada compuesta por abogados, asistentes legales, consultores médicos y personal de apoyo, todos comprometidos con brindar el más alto nivel de representación legal a los neoyorquinos lesionados.',
        buttonLabel: 'Obtenga Ayuda Ahora',
        buttonHref: '/es/contactenos/',
      },
    },
  },
}
