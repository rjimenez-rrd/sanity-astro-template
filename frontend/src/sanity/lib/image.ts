import {createImageUrlBuilder} from '@sanity/image-url'
import {projectId, dataset} from './env'

const builder = createImageUrlBuilder({projectId, dataset})

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}
