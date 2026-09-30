import {defineField} from 'sanity'
import {DEVICES} from '../../components/controls/responsive'

/*
 * Per-device schema fields: an object with one value each for desktop, tablet
 * and mobile. The tab inputs read them with resolveResponsive, so a device
 * left empty follows the next larger one. Not collapsible, since the tabs'
 * custom inputs draw them.
 */
export {DEVICES}

const flat = {collapsible: false}

export function responsiveString(name: string, values: string[], title?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    options: flat,
    fields: DEVICES.map((device) => defineField({name: device, type: 'string', options: {list: values}})),
  })
}

export function responsiveNumber(name: string, title?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    options: flat,
    fields: DEVICES.map((device) => defineField({name: device, type: 'number'})),
  })
}

/** A number with a unit per device: {size, unit}. */
export function responsiveSize(name: string, units: string[], title?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    options: flat,
    fields: DEVICES.map((device) =>
      defineField({
        name: device,
        type: 'object',
        fields: [
          defineField({name: 'size', type: 'number'}),
          defineField({name: 'unit', type: 'string', options: {list: units}}),
        ],
      }),
    ),
  })
}
