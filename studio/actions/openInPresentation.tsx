import {EyeOpenIcon} from '@sanity/icons'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {documentPath} from './documentPath'

export const openInPresentation: DocumentActionComponent = (props: DocumentActionProps) => {
  const path = documentPath(props.type, (props.draft ?? props.published) as Record<string, any> | null)
  if (path === undefined) return null

  return {
    label: 'Open in Presentation',
    icon: EyeOpenIcon,
    disabled: !path,
    title: path ? `Preview ${path}` : 'Add a slug first',
    onHandle: () => {
      if (path) {
        window.location.href = `/presentation?preview=${encodeURIComponent(path)}`
      }
    },
  }
}
