import { DocumentIcon } from '@sanity/icons'
import { Flex, Text } from '@sanity/ui'
import { useEffect, useState } from 'react'
import { useClient, useUser, type SanityClient } from 'sanity'

/**
 * The last editor's photo for a document list row. It comes from the
 * `lastEditedBy` stamp (actions/stampLastEditor.ts) when there is
 * one, else from the History panel's newest author: the dataset's transaction
 * log, which covers documents nobody has edited since the stamp was added.
 */

/** One lookup per document version, so scrolling past a row doesn't refetch. */
const authors = new Map<string, Promise<string | null>>()

function lastAuthor(client: SanityClient, id: string, updatedAt?: string) {
  const publishedId = id.replace(/^drafts\./, '')
  const key = `${publishedId}@${updatedAt}`
  let author = authors.get(key)
  if (!author) {
    author = client
      .request<unknown>({
        url: `/data/history/${client.config().dataset}/transactions/${publishedId},drafts.${publishedId}`,
        query: {
          excludeContent: 'true',
          includeIdentifiedDocumentsOnly: 'true',
          // Newest first, and only that one.
          reverse: 'true',
          limit: '1',
        },
      })
      // The log is NDJSON; one line may come back already parsed.
      .then((body) => {
        const entry =
          typeof body === 'string'
            ? JSON.parse(body.split('\n').find(Boolean) ?? 'null')
            : body
        return (entry as { author?: string } | null)?.author ?? null
      })
      .catch(() => null)
    authors.set(key, author)
  }
  return author
}

function useLastEditor(id: string, updatedAt?: string) {
  const client = useClient({ apiVersion: '2025-01-01' })
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    lastAuthor(client, id, updatedAt).then((author) => active && setUserId(author))
    return () => {
      active = false
    }
  }, [client, id, updatedAt])
  return userId
}

const fill = { width: '100%', height: '100%', objectFit: 'cover' } as const

/**
 * Makes the thumbnail a circle. Rounding the photo alone isn't enough: Sanity's
 * frame around it keeps its own corners and outline, and its children inherit
 * that radius, so the frame (our parent) is the one to round.
 */
const round = (el: HTMLElement | null) => {
  const frame = el?.parentElement
  if (!frame) return
  frame.style.borderRadius = '50%'
  // Sanity reuses the frame when the row changes (e.g. "Missing document" on
  // delete), so give the corners back once the photo is gone.
  return () => {
    frame.style.borderRadius = ''
  }
}

function Photo({ image, name }: { image?: string; name?: string }) {
  if (image) {
    return (
      <img
        ref={round}
        src={image}
        alt={name ?? ''}
        referrerPolicy="strict-origin-when-cross-origin"
        style={fill}
      />
    )
  }
  if (!name) return <DocumentIcon />
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <Flex ref={round} align="center" justify="center" style={{ width: '100%', height: '100%' }}>
      <Text size={1} weight="semibold" muted>
        {initials}
      </Text>
    </Flex>
  )
}

/** A user from History, resolved to a name and photo the way History does. */
function HistoryPhoto({ userId }: { userId: string }) {
  const [user] = useUser(userId)
  return user ? <Photo image={user.imageUrl} name={user.displayName} /> : <DocumentIcon />
}

type Editor = { id: string; updatedAt?: string; name?: string; image?: string }

/**
 * Row media: the last editor's photo, filling the thumbnail like any image.
 * Media is the one preview slot that takes a component; title and subtitle
 * must be plain strings, or the row shows "Invalid preview config".
 */
export function lastEditorMedia({ id, updatedAt, name, image }: Editor) {
  if (name) return () => <Photo image={image} name={name} />
  return function LastEditorMedia() {
    const userId = useLastEditor(id, updatedAt)
    return userId ? <HistoryPhoto userId={userId} /> : <DocumentIcon />
  }
}
