import {EyeOpenIcon} from '@sanity/icons'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

/** Same document -> URL map as presentationTool's `resolve.locations`. */
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

export const openInPresentation: DocumentActionComponent = (props: DocumentActionProps) => {
  const build = PATHS[props.type]
  if (!build) return null

  const path = build((props.draft ?? props.published) as Record<string, any> | null)

  return {
    label: 'Open in Presentation',
    icon: EyeOpenIcon,
    disabled: !path,
    title: path ? `Preview ${path}` : 'Add a slug first',
    onHandle: () => {
      if (path) {
        window.location.href = `/presentation?preview=${encodeURIComponent(path)}`
      }
      props.onComplete()
    },
  }
}
