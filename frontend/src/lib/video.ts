/**
 * The Video block (and Style -> Background -> Video): which player a link or
 * upload becomes, with the Content tab's options as that player's settings.
 */
import {dataset, projectId} from '@/sanity/lib/env'

// --- Reading links ---

export const youtubeId = (url: string) =>
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url)?.[1]

export const vimeoId = (url: string) => /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)?.[1]

export const dailymotionId = (url: string) =>
  /(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-z0-9]+)/i.exec(url)?.[1]

export const videopressId = (url: string) => /videopress\.com\/(?:v|embed)\/([a-z0-9]+)/i.exec(url)?.[1]

/** An uploaded file's CDN address, from its reference: file-<id>-<ext>. */
export function sanityFileUrl(ref: string | null | undefined): string | undefined {
  const match = ref && /^file-([a-f0-9]+)-([a-z0-9]+)$/i.exec(ref)
  return match ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.${match[2]}` : undefined
}

const https = (url: string | null | undefined) => {
  const trimmed = url?.trim()
  return trimmed && /^https:\/\//i.test(trimmed) ? trimmed : undefined
}

const seconds = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined

// --- The Video block ---

export interface VideoSettings {
  source?: string | null
  url?: string | null
  hostedExternal?: boolean | null
  hostedUrl?: string | null
  file?: {asset?: {_ref?: string} | null} | null
  startTime?: number | null
  endTime?: number | null
  autoplay?: boolean | null
  mute?: boolean | null
  loop?: boolean | null
  controls?: boolean | null
  captions?: boolean | null
  privacyMode?: boolean | null
  lazyLoad?: boolean | null
  suggestedVideos?: string | null
  introTitle?: boolean | null
  introPortrait?: boolean | null
  introByline?: boolean | null
  showLogo?: boolean | null
  controlsColor?: string | null
  download?: boolean | null
}

export type VideoPlayer =
  | {kind: 'embed'; src: string; title: string}
  | {kind: 'file'; src: string; start?: number; end?: number}

const flag = (on: boolean | null | undefined) => (on ? '1' : '0')
const hex = (color: string | null | undefined) =>
  color && /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : undefined

/**
 * The player for a Video block, or undefined when its link isn't one this
 * source can play. `play` forces autoplay — for the Image Overlay, whose click
 * starts the video.
 */
export function videoPlayer(v: VideoSettings, {play = false} = {}): VideoPlayer | undefined {
  const source = v.source ?? 'youtube'
  const start = seconds(v.startTime)
  const end = seconds(v.endTime)
  const autoplay = play || Boolean(v.autoplay)
  const controls = v.controls !== false

  if (source === 'hosted') {
    const src = v.hostedExternal ? https(v.hostedUrl) : sanityFileUrl(v.file?.asset?._ref)
    return src ? {kind: 'file', src, start, end} : undefined
  }

  const url = https(v.url)
  if (!url) return undefined

  if (source === 'youtube') {
    const id = youtubeId(url)
    if (!id) return undefined
    const params = new URLSearchParams({
      autoplay: flag(autoplay),
      mute: flag(v.mute),
      controls: flag(controls),
      // Current Video Channel: suggestions from the same channel only.
      rel: v.suggestedVideos === 'any' ? '1' : '0',
      playsinline: '1',
    })
    if (v.captions) params.set('cc_load_policy', '1')
    if (start) params.set('start', String(start))
    if (end) params.set('end', String(end))
    // YouTube only loops a single video when it's also its own playlist.
    if (v.loop) {
      params.set('loop', '1')
      params.set('playlist', id)
    }
    const host = v.privacyMode ? 'www.youtube-nocookie.com' : 'www.youtube.com'
    return {kind: 'embed', src: `https://${host}/embed/${id}?${params}`, title: 'YouTube video player'}
  }

  if (source === 'vimeo') {
    const id = vimeoId(url)
    if (!id) return undefined
    const params = new URLSearchParams({
      autoplay: flag(autoplay),
      muted: flag(v.mute),
      loop: flag(v.loop),
      controls: flag(controls),
      title: flag(v.introTitle !== false),
      portrait: flag(v.introPortrait !== false),
      byline: flag(v.introByline !== false),
      playsinline: '1',
    })
    if (v.privacyMode) params.set('dnt', '1')
    const color = hex(v.controlsColor)
    if (color) params.set('color', color)
    return {
      kind: 'embed',
      src: `https://player.vimeo.com/video/${id}?${params}${start ? `#t=${start}s` : ''}`,
      title: 'Vimeo video player',
    }
  }

  if (source === 'dailymotion') {
    const id = dailymotionId(url)
    if (!id) return undefined
    const params = new URLSearchParams({
      autoplay: flag(autoplay),
      mute: flag(v.mute),
      loop: flag(v.loop),
      controls: controls ? 'true' : 'false',
      'ui-logo': v.showLogo === false ? 'false' : 'true',
    })
    if (start) params.set('start', String(start))
    const color = hex(v.controlsColor)
    if (color) params.set('ui-highlight', color)
    return {kind: 'embed', src: `https://www.dailymotion.com/embed/video/${id}?${params}`, title: 'Dailymotion video player'}
  }

  if (source === 'videopress') {
    const id = videopressId(url)
    if (!id) return undefined
    const params = new URLSearchParams({
      autoPlay: flag(autoplay),
      muted: flag(v.mute),
      loop: flag(v.loop),
      controls: flag(controls),
    })
    if (start) params.set('at', String(start))
    return {kind: 'embed', src: `https://videopress.com/embed/${id}?${params}`, title: 'VideoPress video player'}
  }

  return undefined
}

/** Style -> Aspect Ratio as a CSS aspect-ratio (16:9 -> "16 / 9"). */
export function aspectRatio(value: string | null | undefined): string {
  const match = value && /^(\d+):(\d+)$/.exec(value)
  return match ? `${match[1]} / ${match[2]}` : '16 / 9'
}
