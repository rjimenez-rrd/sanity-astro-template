import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {DEFAULT_LANGUAGE} from '../schemaTypes/languages'

/**
 * Document -> frontend path. Mirrors presentationTool's `resolve.locations` in
 * sanity.config.ts; shared by the actions that open a document on the site.
 */

/** /<parents>/<slug>, under /<language> for anything but the default. */
export function pagePath(slug: string, language?: string | null, parents: Array<string | null | undefined> = []) {
  const path = [...parents.filter(Boolean), slug].join('/')
  return !language || language === DEFAULT_LANGUAGE ? `/${path}` : `/${language}/${path}`
}

const PAGE_TYPES = new Set(['page', 'practiceArea'])

function syncPath(type: string, doc: Record<string, any> | null): string | null | undefined {
  // The Spanish home (homePage-es) is /es.
  if (type === 'homePage') return doc?.language && doc.language !== DEFAULT_LANGUAGE ? `/${doc.language}` : '/'
  const slug = doc?.slug?.current
  // A news post is /news/<slug>, /es/news/<slug> in Spanish.
  if (type === 'newsPost') return slug ? pagePath(slug, doc?.language, ['news']) : null
  if (!PAGE_TYPES.has(type)) return undefined
  return slug ? pagePath(slug, doc?.language) : null
}

/**
 * The document's path on the site: `undefined` when the type has no page,
 * `null` while it needs a slug first. A page under a Parent Page needs its
 * ancestors' slugs, which live in other documents, so those are looked up
 * (drafts included, so a just-renamed parent already counts).
 */
export function useDocumentPath(type: string, doc: Record<string, any> | null): string | null | undefined {
  const client = useClient({apiVersion: '2025-03-20'})
  const parentId: string | undefined = PAGE_TYPES.has(type) ? doc?.parent?._ref : undefined
  const slug: string | undefined = doc?.slug?.current
  const language: string | undefined = doc?.language
  const [parents, setParents] = useState<Array<string | null> | undefined>(undefined)

  useEffect(() => {
    if (!parentId) return
    let cancelled = false
    client
      .withConfig({perspective: 'drafts'})
      .fetch<Array<string | null> | null>(
        `*[_id == $id][0]{"s": [parent->parent->slug.current, parent->slug.current, slug.current]}.s`,
        {id: parentId},
      )
      .then((result) => !cancelled && setParents(result ?? []))
      .catch(() => !cancelled && setParents([]))
    return () => {
      cancelled = true
    }
  }, [client, parentId])

  if (!parentId) return syncPath(type, doc)
  if (!slug) return null
  // Until the parents are known, there's no path to open yet.
  return parents ? pagePath(slug, language, parents) : null
}
