import {EyeOpenIcon} from '@sanity/icons'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {usePresentationParams} from 'sanity/presentation'
import {useRouterState} from 'sanity/router'
import {documentPath} from './documentPath'

export const openInPresentation: DocumentActionComponent = (props: DocumentActionProps) => {
  // Already in Presentation: the preview is right there beside the form.
  // Presentation nests its own router, so its params context is the reliable
  // sign (null outside it); the top-level tool name backs it up.
  const inPresentation = usePresentationParams(false) !== null
  const tool = useRouterState((state) => state.tool)
  const path = documentPath(props.type, (props.draft ?? props.published) as Record<string, any> | null)
  if (inPresentation || tool === 'presentation' || path === undefined) return null

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
