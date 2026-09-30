/**
 * Style -> Background -> Video and Slideshow, turned into what the page
 * renders (components/page-builder/sections/SectionMedia.astro).
 */
import {dataset, projectId} from '@/sanity/lib/env'
import {urlFor} from '@/sanity/lib/image'

export interface BackgroundVideo {
  url?: string | null
  file?: {asset?: {_ref?: string} | null} | null
  start?: number | null
  end?: number | null
  playOnce?: boolean | null
  playOnMobile?: boolean | null
  fallback?: {asset?: {_ref?: string} | null} | null
}

export interface BackgroundSlideshow {
  images?: Array<{asset?: {_ref?: string} | null} | null> | null
  loop?: boolean | null
  duration?: number | null
  transition?: string | null
  transitionDuration?: number | null
  size?: string | null
  position?: string | null
  kenBurns?: boolean | null
  kenBurnsDirection?: string | null
}

const seconds = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined

/** An uploaded file's CDN address, from its reference: file-<id>-<ext>. */
function fileUrl(ref: string | undefined): string | undefined {
  const match = ref && /^file-([a-f0-9]+)-([a-z0-9]+)$/i.exec(ref)
  return match ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.${match[2]}` : undefined
}

export type VideoSource =
  | {kind: 'file'; src: string; start?: number; end?: number}
  | {kind: 'embed'; src: string}

/**
 * What plays: an uploaded file first, else the link — a YouTube or Vimeo
 * page (embedded muted, looping and without controls, as a background), or a
 * direct video file. Only https links.
 */
export function videoSource(video: BackgroundVideo | null | undefined): VideoSource | undefined {
  if (!video) return undefined
  const start = seconds(video.start)
  const end = seconds(video.end)
  const uploaded = fileUrl(video.file?.asset?._ref)
  if (uploaded) return {kind: 'file', src: uploaded, start, end}

  const url = video.url?.trim()
  if (!url || !/^https:\/\//i.test(url)) return undefined

  const youtube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url)
  if (youtube) {
    const id = youtube[1]
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      disablekb: '1',
      playsinline: '1',
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
    })
    if (start) params.set('start', String(start))
    if (end) params.set('end', String(end))
    // YouTube only loops a single video when it's also its own playlist.
    if (!video.playOnce) {
      params.set('loop', '1')
      params.set('playlist', id)
    }
    return {kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?${params}`}
  }

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
  if (vimeo) {
    // background=1 is Vimeo's muted, chromeless, autoplaying mode.
    const params = new URLSearchParams({background: '1', autoplay: '1', muted: '1', loop: video.playOnce ? '0' : '1'})
    return {kind: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}?${params}${start ? `#t=${start}s` : ''}`}
  }

  return {kind: 'file', src: url, start, end}
}

/** An image's CDN address at background size, or undefined without one. */
export function backgroundImageUrl(image: {asset?: {_ref?: string} | null} | null | undefined, width = 1920) {
  return image?.asset?._ref ? urlFor(image as never).width(width).auto('format').url() : undefined
}
