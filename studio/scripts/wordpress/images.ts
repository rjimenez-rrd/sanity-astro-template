/**
 * Images: uploaded to Sanity once each. Uploads are remembered in
 * .wp-import/assets.json, so running the import again reuses them.
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {client, options, OUT_DIR, site, type Obj} from './options'

const CACHE_FILE = join(OUT_DIR, 'assets.json')

/** Image address → Sanity asset id. */
const uploaded: Record<string, string> = (() => {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
})()

/** The image's bytes: from WP_UPLOADS_DIR when it has the file, else downloaded from the site. */
async function imageBytes(url: string): Promise<Buffer> {
  const uploadsPath = url.match(/\/wp-content\/uploads\/(.+)$/)?.[1]
  const local = options.uploadsDir && uploadsPath && join(options.uploadsDir, decodeURIComponent(uploadsPath))
  if (local && existsSync(local)) return readFileSync(local)
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (Sanity WordPress import)'}})
  if (!res.ok) throw new Error(`${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** The Sanity asset id for an image address, uploading it the first time; null when it can't be had. */
async function upload(url: string | undefined): Promise<string | null> {
  if (!url) return null
  const absolute = new URL(url, site.url).href
  if (uploaded[absolute]) return uploaded[absolute]
  // A placeholder id, so a dry run shows where images go without uploading them.
  if (options.dryRun) return `image-dry-run-${Buffer.from(absolute).toString('base64url').slice(-16)}`
  try {
    const filename = decodeURIComponent(new URL(absolute).pathname.split('/').pop() || 'image')
    const asset = await client.assets.upload('image', await imageBytes(absolute), {filename})
    uploaded[absolute] = asset._id
    writeFileSync(CACHE_FILE, JSON.stringify(uploaded, null, 2))
    return asset._id
  } catch (error) {
    console.warn(`  Couldn't upload ${absolute}: ${(error as Error).message}`)
    return null
  }
}

/** An image field for a WordPress image address, or null. */
export async function imageField(url: string | undefined, alt?: string): Promise<Obj | null> {
  const ref = await upload(url)
  return ref ? {_type: 'image', asset: {_type: 'reference', _ref: ref}, ...(alt ? {alt} : {})} : null
}
