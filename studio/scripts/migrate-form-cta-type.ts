/**
 * Renames the Form CTA document type: formCtaSection -> ctaForm.
 *
 * A document's _type is immutable — Sanity even rejects deleting and
 * re-creating it under the same _id in one transaction — so each Form CTA is
 * copied to a new _id under the new type and every reference to it is
 * repointed, in one transaction. Only then is the original deleted: Sanity
 * checks a delete against the references stored before the transaction, so
 * the repoint has to be committed first. Should the delete fail, what's left
 * is an unreferenced copy — harmless, and re-running finishes the job.
 *
 * Dry by default: prints the plan and has Sanity dry-run the exact
 * transaction (referential integrity included) without writing anything.
 *
 *   npx sanity exec scripts/migrate-form-cta-type.ts --with-user-token
 *   npx sanity exec scripts/migrate-form-cta-type.ts --with-user-token -- --apply
 */
import {getCliClient} from 'sanity/cli'

const OLD_TYPE = 'formCtaSection'
const NEW_TYPE = 'ctaForm'
const APPLY = process.argv.includes('--apply')

// Raw perspective: drafts and published copies are separate documents, and
// both have to move.
const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({perspective: 'raw'})

type Doc = Record<string, unknown> & {_id: string; _type: string}

/** A published id's new id; a draft keeps its drafts. prefix. */
const newIdFor = (id: string) =>
  id.startsWith('drafts.') ? `drafts.cta-form-${id.slice(7)}` : `cta-form-${id}`

/**
 * Patch paths of every reference to `id` inside `doc`, addressed by _key so
 * nothing else in the document is touched — e.g.
 * pageBuilder[_key=="a"].columns[_key=="b"].content[_key=="c"].ctaForm._ref
 */
function refPaths(node: unknown, id: string, path = ''): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => {
      const key = (item as {_key?: string})?._key
      return refPaths(item, id, `${path}[${key ? `_key=="${key}"` : i}]`)
    })
  }
  if (!node || typeof node !== 'object') return []
  const n = node as Record<string, unknown>
  if (n._ref === id) return [`${path}._ref`]
  return Object.entries(n).flatMap(([k, v]) => refPaths(v, id, path ? `${path}.${k}` : k))
}

async function main() {
  const docs = await client.fetch<Doc[]>('*[_type == $type]', {type: OLD_TYPE})
  console.log(`${docs.length} document(s) of type "${OLD_TYPE}"${APPLY ? '' : ' — DRY RUN, nothing will be written'}\n`)
  if (docs.length === 0) return console.log('Nothing to migrate.')

  const tx = client.transaction()
  for (const doc of docs) {
    // System fields are assigned by the Content Lake on create.
    const {_rev, _createdAt, _updatedAt, _id, ...content} = doc
    const newId = newIdFor(_id)
    const next = {...content, _id: newId, _type: NEW_TYPE} as Doc
    const carried = Object.keys(content).filter((k) => k !== '_type')
    console.log(`  ${_id}  "${doc.name ?? ''}"`)
    console.log(`    -> ${newId}  (${OLD_TYPE} -> ${NEW_TYPE}, ${carried.length} fields carried over)`)

    tx.create(next)

    // Every document pointing at it, drafts included, repointed in place.
    const users = await client.fetch<Doc[]>('*[references($id)]', {id: _id})
    for (const user of users) {
      const paths = refPaths(user, _id)
      console.log(`    repoint ${user._id} (${user._type}):`)
      paths.forEach((path) => console.log(`      ${path}`))
      tx.patch(user._id, (patch) => patch.set(Object.fromEntries(paths.map((path) => [path, newId]))))
    }

  }

  // Step 1 — create + repoint. Sanity validates the whole transaction and, on
  // a dry run, writes nothing.
  const result = await tx.commit({dryRun: !APPLY, visibility: 'sync'})
  console.log(`\nStep 1 (create + repoint) ${APPLY ? 'committed' : 'dry run accepted by Sanity'}: ${result.results.length} mutation(s)`)

  // Step 2 — delete the originals, now that nothing points at them.
  if (!APPLY) {
    console.log(`Step 2 (delete ${docs.map((d) => d._id).join(', ')}) runs after step 1 is committed.`)
  } else {
    for (const {_id} of docs) {
      const still = await client.fetch<number>('count(*[references($id)])', {id: _id})
      if (still > 0) {
        console.log(`Step 2: kept ${_id} — ${still} document(s) still reference it`)
        continue
      }
      await client.delete(_id)
      console.log(`Step 2: deleted ${_id}`)
    }
  }

  if (APPLY) {
    const left = await client.fetch<number>('count(*[_type == $type])', {type: OLD_TYPE})
    const now = await client.fetch<number>('count(*[_type == $type])', {type: NEW_TYPE})
    console.log(`Now: ${left} "${OLD_TYPE}", ${now} "${NEW_TYPE}"`)
  } else {
    console.log('Re-run with -- --apply to write.')
  }
}

main().catch((err) => {
  console.error('FAILED —', err.message)
  process.exit(1)
})
