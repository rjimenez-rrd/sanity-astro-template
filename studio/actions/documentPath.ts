/**
 * Document -> frontend path. Mirrors presentationTool's `resolve.locations` in
 * sanity.config.ts; shared by the actions that open a document on the site.
 */
const PATHS: Record<string, (doc: Record<string, any> | null) => string | undefined> = {
  homePage: () => '/',
  page: (doc) => {
    const slug = doc?.slug?.current
    return slug ? `/${slug}` : undefined
  },
  blogPost: (doc) => {
    const slug = doc?.slug?.current
    return slug ? `/blog/${slug}` : undefined
  },
}

/** `undefined` when the type has no page, `null` when it needs a slug first. */
export function documentPath(type: string, doc: Record<string, any> | null): string | null | undefined {
  const build = PATHS[type]
  if (!build) return undefined
  return build(doc) ?? null
}
