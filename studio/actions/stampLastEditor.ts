import { useEffect, useRef } from 'react'
import {
  useCurrentUser,
  useDocumentOperation,
  useSyncState,
  type DocumentActionComponent,
} from 'sanity'
import { isPublishing } from './publishWithDate'

/** Types with a hidden `lastEditedBy` field, shown in their document list row. */
export const LAST_EDITED_TYPES = new Set(['page'])

type Stamped = { lastEditedBy?: { id?: string } }

/**
 * Records who is editing a document in its `lastEditedBy` field. It has no
 * button: it's a document action only because actions are mounted for every
 * open document with its draft at hand, like the publish-date stamp.
 *
 * It writes when this browser has edits in flight (isSyncing) on a draft that
 * names someone else, so it writes once per editor rather than per keystroke,
 * and never for someone else's edits or a discard (no draft left). Not for a
 * publish either: Publish writes the publish date first, which is in flight
 * too, so it waits while a publish is under way. And when someone else's stamp
 * arrives while this page is open (both editing at once), it holds off for
 * TAKEOVER_MS instead of stamping straight back on every keystroke.
 */
const TAKEOVER_MS = 30_000

export const StampLastEditor: DocumentActionComponent = (props) => {
  const user = useCurrentUser()
  const { isSyncing } = useSyncState(props.id, props.type)
  const { patch } = useDocumentOperation(props.id, props.type)
  const stampedId = (props.draft as Stamped | null)?.lastEditedBy?.id

  // When another editor's stamp last arrived while this page was open. Not
  // an old stamp found on opening, so a fresh edit still stamps at once.
  const seenId = useRef(stampedId)
  const otherStampedAt = useRef(0)
  useEffect(() => {
    if (stampedId !== seenId.current && stampedId && stampedId !== user?.id) {
      otherStampedAt.current = Date.now()
    }
    seenId.current = stampedId
  }, [stampedId, user?.id])

  useEffect(() => {
    if (!isSyncing || !props.draft || !user || stampedId === user.id) return
    if (isPublishing(props.id)) return
    if (Date.now() - otherStampedAt.current < TAKEOVER_MS) return
    patch.execute([
      { set: { lastEditedBy: { id: user.id, name: user.name, image: user.profileImage } } },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, Boolean(props.draft), user?.id, stampedId])

  return null
}
StampLastEditor.displayName = 'StampLastEditor'
