/**
 * Snapshots the dataset's published content into seed/content.tar.gz, images
 * included, for `npm run seed` to import into any project or dataset.
 *
 * Exports every document type found in the dataset except Sanity's internal
 * ones (preview-access secrets, releases, ...), so a new content type is
 * picked up without editing this list. Drafts are left out.
 *
 *   npm run seed:export
 */
import {spawnSync} from 'node:child_process'
import {getCliClient} from 'sanity/cli'

const OUTPUT = 'seed/content.tar.gz'

/** Sanity's own types that are content: uploaded images and files. */
const ASSET_TYPES = new Set(['sanity.imageAsset', 'sanity.fileAsset'])

// sanity exec compiles to CommonJS, which has no top-level await.
async function main() {
  const client = getCliClient({apiVersion: '2025-02-19'})
  const {dataset} = client.config()

  const allTypes: string[] = await client.fetch('array::unique(*[]._type)', {}, {perspective: 'raw'})
  const types = allTypes
    .filter((type) => ASSET_TYPES.has(type) || !/^(sanity|system)\./.test(type))
    .sort()

  console.log(`Exporting ${dataset}: ${types.join(', ')}`)
  console.log(`Skipping: ${allTypes.filter((type) => !types.includes(type)).join(', ') || 'nothing'}\n`)

  const result = spawnSync(
    'npx',
    ['sanity', 'dataset', 'export', dataset!, OUTPUT, '--no-drafts', '--overwrite', '--types', types.join(',')],
    {stdio: 'inherit'},
  )
  process.exit(result.status ?? 1)
}

main()
