import { useEffect } from 'react'
import {
  useCurrentUser,
  useDocumentOperation,
  useSyncState,
  type DocumentActionComponent,
} from 'sanity'

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
 * and never for someone else's edits, a publish or a discard (no draft left).
 */
export const StampLastEditor: DocumentActionComponent = (props) => {
  const user = useCurrentUser()
  const { isSyncing } = useSyncState(props.id, props.type)
  const { patch } = useDocumentOperation(props.id, props.type)
  const stampedId = (props.draft as Stamped | null)?.lastEditedBy?.id

  useEffect(() => {
    if (!isSyncing || !props.draft || !user || stampedId === user.id) return
    patch.execute([
      { set: { lastEditedBy: { id: user.id, name: user.name, image: user.profileImage } } },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, Boolean(props.draft), user?.id, stampedId])

  return null
}
StampLastEditor.displayName = 'StampLastEditor'
