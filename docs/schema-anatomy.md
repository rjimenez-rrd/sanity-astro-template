# Anatomy of a Sanity schema type

A reference for reading and writing the schema files in `studio/schemaTypes/`.
Every example is from this codebase.

## Groups are the tabs

`groups` renders the row of tabs across the top of a form. Containers define theirs
once and share them between rows and columns, in
`schemaTypes/tabs/index.ts`:

```ts
export const CONTAINER_TABS = [
  {name: 'layout',     title: 'Layout',     icon: ThLargeIcon,    default: true},
  {name: 'style',      title: 'Style',      icon: ColorWheelIcon},
  {name: 'advanced',   title: 'Advanced',   icon: CogIcon},
  {name: 'visibility', title: 'Visibility', icon: EyeOpenIcon},
]
```

| Key | Effect |
| --- | --- |
| `name` | The id a field references |
| `title` | The tab label |
| `icon` | Shown beside the label |
| `default` | Which tab opens first |

A field joins a tab by naming it:

```ts
defineField({name: 'label', type: 'string', group: 'layout'})
```

- A field with **no** `group` appears on **every** tab.
- A field can belong to several: `group: ['layout', 'advanced']`.

## Type-level keys

| Key | What it does |
| --- | --- |
| `name` | Internal id. Stored as `_type`, and what GROQ filters on. **Never change it once content exists.** |
| `title` | Human label. `gridRow` is titled "Container". |
| `type` | `'object'`, `'document'`, `'array'`, a primitive, or another type's name |
| `icon` | Shown in insert menus and list items |
| `groups` | The tabs, above |
| `fieldsets` | Groups fields *within* a tab as a sub-box, optionally collapsible |
| `fields` | The fields themselves |
| `preview` | How the item renders in a list |

### `fieldsets` vs `groups`

A group is a tab. A fieldset is a box inside one. The Video block
(`blocks/video.ts`) uses both — its on/off switches sit in a "Video Options" box
on the Content tab, and each hides itself for sources that don't support it:

```ts
fieldsets: [{name: 'videoOptions', title: 'Video Options', options: {collapsible: false}}],
```

```ts
// what option('captions', 'Captions', ['youtube']) builds
defineField({
  name: 'captions',
  type: 'boolean',
  group: 'content',          // which tab
  fieldset: 'videoOptions',  // which box within it
  hidden: ({parent}) => !isOneOf(parent, 'youtube'),
})
```

### `preview`

`select` pulls values by path; `prepare` turns them into what the list shows.
Simplified from `gridRow`'s (see [grid-row.md](grid-row.md#preview) for the real
titles):

```ts
preview: {
  select: {label: 'label', columns: 'columns', layoutType: 'container.layoutType'},
  prepare({label, columns, layoutType}) {
    return {title: label || 'Container', subtitle: `${columns?.length ?? 0} items`}
  },
},
```

`prepare` returns `{title, subtitle, media}`. `media` takes an image field or a
component — `gridRow` passes `DashboardIcon`.

## Field-level keys

| Key | What it does |
| --- | --- |
| `initialValue` | Value a new item starts with. A value, or a function returning one. |
| `validation` | `required()`, `min()`, `max()`, `regex()`, `custom()`. `.warning()` makes it advisory instead of blocking. |
| `hidden` | Hide conditionally. Receives `({parent, document, value, currentUser})`. |
| `readOnly` | Same signature, but the field stays visible and locked. |
| `options` | Type-specific: `list` for a dropdown, `layout: 'radio'`, `hotspot: true` for images, `collapsible` / `collapsed` for objects. |
| `components` | Replace the default UI — `{input}`, `{field}`, `{item}`, `{preview}`. |
| `description` | Help text under the label. |
| `group` / `fieldset` | Placement, above. |
| `of` | Arrays only — the member types allowed. |
| `to` | References only — the document types that can be linked. |

### `initialValue`

Static, or computed at insert time. `gridRow` uses a function so each column gets
a fresh `_key`:

```ts
initialValue: () => [createColumn(), createColumn()],
```

Note it only fires when an item is **created**. It never backfills existing
documents — changing an `initialValue` leaves saved content as it was, which is
why old data is moved with a script in `studio/scripts/` instead.

### `validation`

```ts
validation: (rule) => rule.required().min(1),
```

Blocking by default. Chain `.warning()` to make it advisory — the editor sees it
but can still publish:

```ts
validation: (rule) =>
  rule.regex(/^\d+(\.\d+)?(px|%|rem|em|vw)$/, {name: 'CSS width'})
      .warning('Use a number with a unit, like 320px or 50%.'),
```

`custom()` gets the sibling context, which is how the layout preset is required
only in Grid mode:

```ts
validation: (rule) =>
  rule.custom((value, context) =>
    usesGridTemplate(context.parent) && !value ? 'Pick a grid template' : true,
  ),
```

### `components.input`

The extension point this project leans on hardest. `spacingField` is an ordinary
object of 13 fields — this one line is the only reason it renders as a
box-model diagram with a device switcher instead of thirteen inputs:

```ts
components: {input: SpacingInput},
```

Custom inputs live in `studio/components/`: the tabs' inputs in `tabs/<tab>/`
(`SpacingInput` is in `tabs/advanced/`), the Typography & Effects panel's in
`block-styles/`, block- and document-specific ones in `inputs/`, and the shared
pieces they're built from in `controls/`. An input receives `ObjectInputProps`
(or the matching props for its type) and writes through `onChange` with `set()` /
`unset()` patches.

> A custom input must be defined at **module scope**. Declaring one inside
> another component's render body gives it a new identity every render, so React
> remounts it on each keystroke and the field loses focus mid-edit.

## Defining vs registering

`defineType` / `defineField` / `defineArrayMember` exist for type inference — they
don't register anything. A type only becomes usable once it's exported from
`schemaTypes/index.ts` and listed in `schema.types` in `sanity.config.ts`.

A type referenced by name that was never registered fails at Studio start, not at
build.

## Related

- [grid-row.md](grid-row.md) — the container block in detail
- [../ARCHITECTURE.md](../ARCHITECTURE.md) — how the schema reaches the page
- [Sanity schema types reference](https://www.sanity.io/docs/schema-types)
