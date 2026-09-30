import {defineField} from 'sanity'
import {BareField} from '../../components/controls/BareField'

/** Visibility tab: hide per device, at Elementor's breakpoints. */
export function visibilityField() {
  const toggle = (name: string, title: string, description: string) =>
    defineField({name, title, type: 'boolean', description, initialValue: false})

  return defineField({
    name: 'visibility',
    title: 'Visibility',
    type: 'object',
    group: 'visibility',
    components: {field: BareField},
    fields: [
      toggle('hideOnDesktop', 'Hide On Desktop', 'Screens 1025px and wider.'),
      toggle('hideOnTablet', 'Hide On Tablet', 'Screens 768px to 1024px.'),
      toggle('hideOnMobile', 'Hide On Mobile', 'Screens 767px and narrower.'),
    ],
  })
}
