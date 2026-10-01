import {useState} from 'react'
import {TrashIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useClient, type DocumentActionComponent} from 'sanity'

/**
 * Delete, for documents with translations (page, practice area, news…).
 *
 * The translations plugin keeps a translation.metadata document listing a
 * document's versions in each language. Sanity's own Delete leaves this
 * document's entry there, pointing at nothing, and the plugin then thinks
 * that language still exists: "Create Spanish version" shows it as created.
 *
 * This removes the entry and deletes the document (published and draft) in
 * one transaction, so either both happen or neither: if the delete is
 * blocked — a menu link still picks this page — nothing changes. The other
 * languages' versions stay, still linked to each other.
 */
export const DeleteWithTranslations: DocumentActionComponent = ({id, draft, published, onComplete}) => {
  const client = useClient({apiVersion: '2025-02-19'})
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const doc = draft ?? published
  const title = (doc?.title as string | undefined) || 'this document'

  const remove = async () => {
    setBusy(true)
    try {
      const metadataIds = await client.fetch<string[]>(
        `*[_type == "translation.metadata" && references($id)]._id`,
        {id},
      )
      const tx = client.transaction()
      for (const metadataId of metadataIds) {
        tx.patch(metadataId, (p) => p.unset([`translations[value._ref == "${id}"]`]))
      }
      tx.delete(id).delete(`drafts.${id}`)
      await tx.commit()
      toast.push({status: 'success', title: `Deleted “${title}”`})
      onComplete()
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Couldn’t delete',
        // Usually another document still links to it (e.g. a menu's Page).
        description: error instanceof Error ? error.message : String(error),
      })
      setBusy(false)
      setConfirming(false)
    }
  }

  return {
    label: busy ? 'Deleting…' : 'Delete',
    icon: TrashIcon,
    tone: 'critical',
    disabled: !doc || busy,
    onHandle: () => setConfirming(true),
    dialog: confirming && {
      type: 'confirm',
      tone: 'critical',
      message: `Delete “${title}”? Its versions in other languages are kept.`,
      onCancel: () => setConfirming(false),
      onConfirm: remove,
    },
  }
}
DeleteWithTranslations.action = 'delete'
