import {defineField} from 'sanity'

export const ENTRANCE_ANIMATIONS = [
  {title: 'None', value: 'none'},
  {title: 'Fade In', value: 'fadeIn'},
  {title: 'Fade In Up', value: 'fadeInUp'},
  {title: 'Fade In Down', value: 'fadeInDown'},
  {title: 'Fade In Left', value: 'fadeInLeft'},
  {title: 'Fade In Right', value: 'fadeInRight'},
  {title: 'Zoom In', value: 'zoomIn'},
]

type MotionParent = {animation?: string} | undefined
const off = ({parent}: {parent?: unknown}) => {
  const animation = (parent as MotionParent)?.animation
  return !animation || animation === 'none'
}

/**
 * Elementor-style entrance animation: plays once when the element scrolls
 * into view. Off unless an editor picks one.
 */
export function motionField() {
  return defineField({
    name: 'motion',
    title: 'Motion Effects',
    type: 'object',
    options: {collapsible: true, collapsed: true},
    fields: [
      defineField({
        name: 'animation',
        title: 'Entrance Animation',
        type: 'string',
        options: {list: ENTRANCE_ANIMATIONS},
      }),
      defineField({
        name: 'duration',
        title: 'Animation Duration',
        type: 'string',
        hidden: off,
        options: {
          list: [
            {title: 'Slow', value: 'slow'},
            {title: 'Normal', value: 'normal'},
            {title: 'Fast', value: 'fast'},
          ],
          layout: 'radio',
          direction: 'horizontal',
        },
      }),
      defineField({
        name: 'delay',
        title: 'Animation Delay (ms)',
        type: 'number',
        hidden: off,
        validation: (rule) => rule.min(0).max(10000).integer(),
      }),
    ],
  })
}
