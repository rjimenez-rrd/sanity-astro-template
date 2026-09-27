import type {PreviewProps} from 'sanity'
import {phoneChoiceText, usePhoneSettings} from '../phoneSettings'

/**
 * Shows an inline phone chip in rich text as the words it stands for, e.g.
 * "(833) SANDERS" rather than "main", so editors read the sentence as the
 * site will. The saved choice arrives as the preview title (see site-info.ts).
 */
export function SiteInfoPreview(props: PreviewProps) {
  const settings = usePhoneSettings()
  const choice = typeof props.title === 'string' ? props.title : undefined
  const text = settings ? phoneChoiceText(settings, choice) : ''
  return props.renderDefault({
    ...props,
    title: text || (settings ? 'No phone in Site Settings' : '…'),
  })
}
