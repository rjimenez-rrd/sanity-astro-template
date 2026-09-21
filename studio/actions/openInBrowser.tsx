import {LaunchIcon} from '@sanity/icons'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {documentPath} from './documentPath'

const ORIGIN = (process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321').replace(/\/$/, '')

/**
 * Draft mode outside Presentation relies on the frontend's dev server, so this
 * action is offered only while the preview points at localhost.
 */
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(ORIGIN)

/**
 * Opens the current document in Google Chrome with draft mode on.
 *
 * A web page can't choose the browser, so this asks the local frontend dev
 * server to launch Chrome (see frontend/src/pages/api/dev/open-in-chrome.ts).
 * If that server can't be reached, it falls back to a tab in this browser.
 */
export const openInBrowser: DocumentActionComponent = (props: DocumentActionProps) => {
  if (!IS_LOCAL) return null

  const path = documentPath(props.type, (props.draft ?? props.published) as Record<string, any> | null)
  if (path === undefined) return null

  return {
    label: 'Open in Chrome',
    icon: LaunchIcon,
    disabled: !path,
    title: path ? `Open ${path} in Chrome with drafts on (dev only)` : 'Add a slug first',
    onHandle: async () => {
      if (path) {
        try {
          const res = await fetch(`${ORIGIN}/api/dev/open-in-chrome?path=${encodeURIComponent(path)}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } catch {
          window.open(`${ORIGIN}/api/draft-mode/enable?dev=1&redirect=${encodeURIComponent(path)}`, '_blank', 'noopener')
        }
      }
      props.onComplete()
    },
  }
}
