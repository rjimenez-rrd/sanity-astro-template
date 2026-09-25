import { useEffect, useState } from 'react'
import {
  useDocumentOperation,
  useSchema,
  useSyncState,
  type DocumentActionComponent,
  type ObjectSchemaType,
} from 'sanity'

/** Types whose publish dates are stamped by publishing rather than typed in. */
export const PUBLISH_DATE_TYPES = new Set(
  ['page', 'newsPost', 'practiceArea', 'caseResult', 'homePage', 'review', 'lawyer', 'newsCategory']
)

type Stamped = { publishedAt?: string; updatedAt?: string }

/**
 * One wrapper per original action, reused. sanity.config's actions resolver
 * runs again whenever the document changes; a new wrapper each time would be a
 * new component to React, which remounts it and drops the pending publish.
 */
const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

/**
 * Publishes waiting for their stamp, by document id. Kept outside the
 * component so a remount mid-wait still finishes the publish.
 */
const pendingById = new Map<string, { updatedAt?: string }>()

/**
 * Wraps Sanity's Publish button to stamp two dates before publishing:
 *
 * - publishedAt: only the first time, so it keeps meaning "first went live".
 * - updatedAt: every time, so it's always the latest publish.
 *
 * Each is written only if the type has that field, in the field's own format:
 * a `date` field (News) takes 2026-09-25, a `datetime` field the timestamp.
 *
 * The publish waits for the stamp to reach the draft. Publishing straight
 * after the patch copies the draft as it was before it, and the patch then
 * lands on a new draft, leaving the document "changed" with Publish enabled.
 */
export function withPublishDate(publish: DocumentActionComponent): DocumentActionComponent {
  const existing = wrapped.get(publish)
  if (existing) return existing

  const PublishWithDate: DocumentActionComponent = (props) => {
    const result = publish(props)
    const { patch, publish: publishOp } = useDocumentOperation(props.id, props.type)
    const { isSyncing } = useSyncState(props.id, props.type)
    const schemaType = useSchema().get(props.type) as ObjectSchemaType | undefined
    // The updatedAt value being waited for; null when nothing is pending.
    const [pending, setPending] = useState(() => pendingById.get(props.id) ?? null)

    const fieldType = (name: string) => schemaType?.fields?.find((f) => f.name === name)?.type.name
    const stampFor = (name: string, now: string) => {
      const type = fieldType(name)
      if (!type) return undefined
      return type === 'date' ? now.slice(0, 10) : now
    }

    useEffect(() => {
      if (!pending) return
      const draft = props.draft as Stamped | null
      // The stamp is in the draft once its updatedAt matches (or, for a type
      // without updatedAt, once publishedAt is there), and saved once syncing
      // is done: the draft shows the patch locally before the server has it,
      // and a publish sent during that gap is dropped. Only then publish.
      const stamped = pending.updatedAt
        ? draft?.updatedAt === pending.updatedAt
        : !fieldType('publishedAt') || Boolean(draft?.publishedAt)
      if (stamped && !isSyncing && !publishOp.disabled) {
        publishOp.execute()
        pendingById.delete(props.id)
        setPending(null)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending, props.draft, publishOp, isSyncing])

    if (!result) return result

    return {
      ...result,
      label: pending ? 'Publishing…' : result.label,
      disabled: Boolean(pending) || result.disabled,
      onHandle: () => {
        const now = new Date().toISOString()
        const publishedAt = stampFor('publishedAt', now)
        const updatedAt = stampFor('updatedAt', now)
        if (publishedAt) patch.execute([{ setIfMissing: { publishedAt } }])
        if (updatedAt) patch.execute([{ set: { updatedAt } }])
        // The effect above publishes once the draft carries the stamp.
        pendingById.set(props.id, { updatedAt })
        setPending({ updatedAt })
      },
    }
  }
  // Keeps the "publish" identity, so Sanity still treats it as the main action.
  PublishWithDate.action = publish.action
  wrapped.set(publish, PublishWithDate)
  return PublishWithDate
}
