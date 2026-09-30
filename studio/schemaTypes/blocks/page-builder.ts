import {defineType, defineArrayMember} from 'sanity'

/**
 * Page builder array: Containers (gridRow).
 * All content is composed through flexible grid layouts.
 */
export const pageBuilderType = defineType({
  name: 'pageBuilder',
  title: 'Page Builder',
  type: 'array',
  of: [
    defineArrayMember({type: 'gridRow'}),
  ],
})