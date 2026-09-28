import {DEFAULT_LANGUAGE} from '../schemaTypes/languages'

/**
 * Document -> frontend path. Mirrors presentationTool's `resolve.locations` in
 * sanity.config.ts; shared by the actions that open a document on the site.
 */
const PATHS: Record<string, (doc: Record<string, any> | null) => string | undefined> = {
  homePage: () => '/',
  page: (doc) => rootPath(doc),
  practiceArea: (doc) => rootPath(doc),
}

function rootPath(doc: Record<string, any> | null): string | undefined {
  const slug = doc?.slug?.current
  if (!slug) return undefined
  const language = doc?.language
  // The default language sits at the root, the others under their id.
  return !language || language === DEFAULT_LANGUAGE ? `/${slug}` : `/${language}/${slug}`
}

/** `undefined` when the type has no page, `null` when it needs a slug first. */
export function documentPath(type: string, doc: Record<string, any> | null): string | null | undefined {
  const build = PATHS[type]
  if (!build) return undefined
  return build(doc) ?? null
}
