/**
 * What the rest of the import shares: the command's options (its flags and
 * studio/.env), the Sanity client, the output folder and the report.
 */
import {existsSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

/** A Sanity document, or any part of one: the import builds them as plain objects. */
export type Obj = Record<string, any>

const STUDIO_DIR = join(__dirname, '..', '..')
const PROJECT_DIR = join(STUDIO_DIR, '..')

// WP_UPLOADS_DIR can live in studio/.env (gitignored); a value typed on the
// command line still wins.
try {
  process.loadEnvFile(join(STUDIO_DIR, '.env'))
} catch {
  // No .env: settings come from the command line.
}

const args = process.argv.slice(2)
const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

/**
 * A path as typed: npm runs this from studio/ even when the command was typed
 * at the project root, so a relative path is looked for where it was typed,
 * in the project root, then in studio/.
 */
function typedPath(path: string | undefined) {
  if (!path) return undefined
  const bases = [process.env.INIT_CWD, PROJECT_DIR, process.cwd()].filter(Boolean) as string[]
  return bases.map((base) => resolve(base, path)).find((p) => existsSync(p)) ?? resolve(path)
}

export const options = {
  /** --xml: the WordPress export file (Tools → Export → All content). */
  exportFile: typedPath(value('xml')),
  /** WP_UPLOADS_DIR: a downloaded copy of wp-content/uploads, read instead of downloading each image. */
  uploadsDir: typedPath(process.env.WP_UPLOADS_DIR || undefined),
  /** --dry: convert, but write nothing to Sanity and upload no images. */
  dryRun: args.includes('--dry'),
  /** --publish: publish what it imports, instead of making drafts. */
  publish: args.includes('--publish'),
  /** --include-existing: import pages even where Sanity already has one at the same address. */
  includeExisting: args.includes('--include-existing'),
  /** --undo: delete everything a previous import created. */
  undo: args.includes('--undo'),
  /** --only=pages or --only=posts. */
  only: value('only'),
  /** --slug: only the page or post with this slug. */
  slug: value('slug'),
  /** --limit: only this many in the default language, plus their translations. */
  limit: Number(value('limit')) || Infinity,
}

export const DEFAULT_LANGUAGE = 'en'

/** Where documents.json, report.json and the uploaded-image cache go: studio/scripts/.wp-import/. */
export const OUT_DIR = join(STUDIO_DIR, 'scripts', '.wp-import')

export const client = getCliClient({apiVersion: '2025-02-19'})

/**
 * The WordPress site's address, read from the export file: links to it become
 * paths, and relative image addresses resolve against it.
 */
export const site = {url: ''}

/** What to rebuild by hand, per page: printed at the end and saved to report.json. */
export const report: Record<string, string[]> = {}
export const note = (where: string, message: string) => (report[where] ??= []).push(message)
