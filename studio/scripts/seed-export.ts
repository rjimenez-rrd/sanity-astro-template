/**
 * Snapshots the dataset's published content into seed/content.tar.gz, images
 * included, for `npm run seed` to import into any project or dataset.
 *
 * Exports every document type found in the dataset except Sanity's internal
 * ones (preview-access secrets, releases, ...), so a new content type is
 * picked up without editing this list. Drafts are left out, and so are the
 * fields in PERSONAL_FIELDS: who edited what is about this site's editors,
 * not content for the next site seeded from it.
 *
 *   npm run seed:export
 */
import {spawnSync} from 'node:child_process'
import {mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {getCliClient} from 'sanity/cli'

const OUTPUT = 'seed/content.tar.gz'

/** Top-level fields removed from every exported document (page.ts lastEditedBy). */
const PERSONAL_FIELDS = ['lastEditedBy']

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
  if (result.status !== 0) process.exit(result.status ?? 1)

  stripPersonalFields()
  console.log(`Removed ${PERSONAL_FIELDS.join(', ')} from the export.`)
}

/** Unpacks the export, drops PERSONAL_FIELDS from each document, packs it again. */
function stripPersonalFields() {
  const dir = mkdtempSync(join(tmpdir(), 'seed-export-'))
  try {
    run('tar', ['-xzf', OUTPUT, '-C', dir])
    // The export is one folder holding data.ndjson and the assets.
    const [folder] = readdirSync(dir)
    const data = join(dir, folder, 'data.ndjson')
    const lines = readFileSync(data, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const doc = JSON.parse(line)
        for (const field of PERSONAL_FIELDS) delete doc[field]
        return JSON.stringify(doc)
      })
    writeFileSync(data, lines.join('\n') + '\n')
    run('tar', ['-czf', OUTPUT, '-C', dir, folder])
  } finally {
    rmSync(dir, {recursive: true, force: true})
  }
}

function run(command: string, args: string[]) {
  const {status} = spawnSync(command, args, {stdio: 'inherit'})
  if (status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

main()
