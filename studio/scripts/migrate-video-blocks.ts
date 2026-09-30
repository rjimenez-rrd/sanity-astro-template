/**
 * Moves the old YouTube Video and External Video blocks to the one Video
 * block (blocks/video.ts), keeping each block's _key so its place on the page
 * and any links to it stay the same:
 *
 *   youtubeVideo  {url}                         -> video {source: 'youtube', url, privacyMode: true}
 *   externalVideo {url, autoplay, loop, muted}  -> video {source: 'hosted', hostedExternal: true,
 *                                                         hostedUrl: url, autoplay, loop, mute}
 *
 * Privacy Mode is on for YouTube because the old block always used
 * youtube-nocookie.com. Blocks are found anywhere in a document (columns,
 * inner columns, tabs), in drafts and published copies alike.
 *
 * Dry by default: prints what would change without writing anything.
 *
 *   npx sanity exec scripts/migrate-video-blocks.ts --with-user-token
 *   npx sanity exec scripts/migrate-video-blocks.ts --with-user-token -- --apply
 */
import {getCliClient} from 'sanity/cli'

const APPLY = process.argv.includes('--apply')
const OLD_TYPES = ['youtubeVideo', 'externalVideo']

// Raw perspective: drafts and published copies are separate documents.
const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({perspective: 'raw'})

type Block = Record<string, unknown> & {_key?: string; _type?: string}

/** The Video block an old block becomes. */
function toVideo(old: Block): Block {
  const {_key, _type, url, caption: _caption, autoplay, loop, muted, ...rest} = old
  const common = {_key, _type: 'video', ...rest}
  if (_type === 'youtubeVideo') return {...common, source: 'youtube', url, privacyMode: true}
  return {
    ...common,
    source: 'hosted',
    hostedExternal: true,
    hostedUrl: url,
    autoplay: autoplay ?? false,
    loop: loop ?? false,
    mute: muted ?? false,
  }
}

/** [path, old block] for every old video block in `node`, addressed by _key. */
function findOld(node: unknown, path = ''): [string, Block][] {
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => {
      const key = (item as Block)?._key
      return findOld(item, `${path}[${key ? `_key=="${key}"` : i}]`)
    })
  }
  if (!node || typeof node !== 'object') return []
  const n = node as Block
  if (n._type && OLD_TYPES.includes(n._type) && path) return [[path, n]]
  return Object.entries(n).flatMap(([k, v]) => (k.startsWith('_') ? [] : findOld(v, path ? `${path}.${k}` : k)))
}

async function main() {
  const docs = await client.fetch<Block[]>(
    `*[_type in ["page", "practiceArea", "homePage", "newsPost"] && defined(pageBuilder)]`,
  )
  const plan = docs
    .map((doc) => ({id: doc._id as string, blocks: findOld(doc.pageBuilder, 'pageBuilder')}))
    .filter((d) => d.blocks.length > 0)

  const total = plan.reduce((n, d) => n + d.blocks.length, 0)
  console.log(`${total} old video block(s) in ${plan.length} document(s)${APPLY ? '' : ' — DRY RUN, nothing will be written'}\n`)
  for (const {id, blocks} of plan) {
    console.log(id)
    for (const [path, old] of blocks) console.log(`  ${old._type} -> video  ${String(old.url ?? '')}\n    at ${path}`)
  }
  if (!APPLY || total === 0) return

  const tx = client.transaction()
  for (const {id, blocks} of plan) {
    tx.patch(id, (p) => p.set(Object.fromEntries(blocks.map(([path, old]) => [path, toVideo(old)]))))
  }
  await tx.commit({autoGenerateArrayKeys: false})
  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
