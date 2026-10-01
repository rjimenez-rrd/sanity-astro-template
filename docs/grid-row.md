# The `gridRow` type

`studio/schemaTypes/blocks/grid-row.ts`

`gridRow` is the page builder's **container** — the section that holds everything
else on a page. The type name is historical; its title in the Studio is
"Container".

A row and a column are deliberately the same kind of thing at different depths:
both use `CONTAINER_TABS` (`schemaTypes/tabs/index.ts`), so both get the same four
tabs — Layout, Style, Advanced, Visibility.

The same file also defines `nestedContainer` — an inner Column placed inside a
column's content. It is built by the same function (`defineContainerType`), so it
has the same fields; its title in the Studio is "Column", and it can't nest again.

## Shape

```
gridRow
├── label              name shown in the Page Builder list
├── container          Layout tab — flex/grid, width, gap, direction, HTML tag
├── layout             column preset (50/50, 33/66, 25/25/25/25, …)
├── columns[]          → gridColumn
│   ├── label
│   ├── container      each column has its own layout settings
│   ├── content[]      the 35 block types, plus nestedContainer (inner Column)
│   ├── link           Advanced tab — makes the whole column clickable
│   └── design · blockStyles · advanced · visibility
└── design · blockStyles · advanced · visibility
```

| Field | Tab | Built by (`schemaTypes/tabs/`) |
| --- | --- | --- |
| `container` | Layout | `layoutField` (`layout.ts`) |
| `design` | Style | `styleField({sectionFeatures: true})` (`style.ts`) — background incl. video/slideshow, overlay, border, shape dividers |
| `blockStyles` | Style | `styleEffectsField({legacyOnly: true})` (`style.ts`) — only shown while it still holds values saved before the Style panel existed |
| `advanced` | Advanced | `advancedField` (`advanced.ts`) |
| `visibility` | Visibility | `visibilityField` (`visibility.ts`) |

```
```

## A note on history

Rows created before the container settings stored layout as four loose fields —
`gap`, `paddingY`, `maxWidth`, `reverseOnMobile` — plus `verticalAlign` on each
column, all rendered through Tailwind class maps. That path has been removed;
`studio/scripts/migrate-legacy-rows.ts` converted the remaining rows into
equivalent `container` and `advanced.padding` settings.

If you restore an old document from history and it renders unstyled, it predates
the migration — re-run that script.

## Two layout modes

`container.layoutType` is either `flex` (the default for new rows) or `grid`.

| | Flexbox | Grid |
| --- | --- | --- |
| Column widths | each column's own `container.width` | the `layout` preset becomes grid-template tracks |
| `layout` preset | seeds how many columns to add and their starting widths | authoritative — defines the tracks |
| Preset required | no | yes |

`usesGridTemplate()` gates that validation:

```ts
const usesGridTemplate = (parent) => parent?.container?.layoutType === 'grid'
```

So a preset is only mandatory in Grid mode. In Flexbox the picker still appears,
but purely as a shortcut for creating and sizing columns.

## Columns start populated

`columns` carries an `initialValue` of two empty columns (one for an inner
Column):

```ts
initialValue: () => (nested ? [createColumn()] : [createColumn(), createColumn()]),
validation: (rule) => rule.required().min(1),
```

Without it, a freshly inserted container would open showing a required-field
error before the editor had done anything. `createColumn()` mirrors
`createEmptyColumn` in `components/tabs/layout/ColumnsInput.tsx`, so a column created
by insert and one created by the "Add columns" button are identical.

`min(1)` still catches a container an editor has emptied out — it just no longer
fires on a brand-new one.

## Preview

The preview changes shape depending on whether the row has been named, so naming
a row never costs you the layout information:

| | Title | Subtitle |
| --- | --- | --- |
| Unnamed | `Container — Flexbox` | `2 items` |
| Unnamed, Grid mode | `Container — Grid 50 / 50` | `2 items` |
| Named `Hero` | `Hero` | `Flexbox · 2 items` |

An inner Column reads `Column — …` instead.

`label` is Studio-only. It is not in any GROQ projection used for rendering, and
in the frontend it only ever appears as a preview-mode badge — never on a
published page.

## Related

- [schema-anatomy.md](schema-anatomy.md) — what `groups`, `fieldsets`,
  `validation` and `components.input` do, if the schema keys are unfamiliar
- `schemaTypes/tabs/` — `layoutField`, `styleField`, `styleEffectsField`,
  `advancedField`, `visibilityField`, and `CONTAINER_TABS`
- `components/tabs/layout/` — the Layout tab's panel (`LayoutInput`), the preset
  picker (`LayoutPickerInput`) and the column list with its "Add columns" button
  (`ColumnsInput`)
- `components/controls/` — the shared controls those panels are built from
- `frontend/src/lib/containerStyles.ts` — turns a container's tabs into scoped CSS
  (via `container.ts`, `design.ts`, `advancedCss.ts`)
- [page-rendering.md](page-rendering.md) — how a container renders, step by step
- [ARCHITECTURE.md](../ARCHITECTURE.md) — how this fits the wider system
