# The `gridRow` type

`studio/schemaTypes/blocks/grid-row.ts`

`gridRow` is the page builder's **container** — the section that holds everything
else on a page. The type name is historical; its title in the Studio is
"Container".

A row and a column are deliberately the same kind of thing at different depths:
both are built from `CONTAINER_GROUPS`, so both get the same four tabs — Layout,
Style, Advanced, Visibility.

## Shape

```
gridRow
├── label              name shown in the Page Builder list
├── container          Layout tab — flex/grid, width, gap, direction
├── layout             column preset (50/50, 33/66, 25/25/25/25, …)
├── columns[]          → gridColumn
│   ├── label
│   ├── container      each column has its own layout settings
│   ├── content[]      the 28 block types
│   └── design · style · advanced · visibility
└── design · style · advanced · visibility
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

`columns` carries an `initialValue` of two empty columns:

```ts
initialValue: () => [createColumn(), createColumn()],
validation: (rule) => rule.required().min(1),
```

Without it, a freshly inserted container would open showing a required-field
error before the editor had done anything. `createColumn()` mirrors
`createEmptyColumn` in `components/inputs/ColumnsInput.tsx`, so a column created
by insert and one created by the "Add columns" button are identical.

`min(1)` still catches a container an editor has emptied out — it just no longer
fires on a brand-new one.

## Preview

The preview changes shape depending on whether the row has been named, so naming
a row never costs you the layout information:

| | Title | Subtitle |
| --- | --- | --- |
| Unnamed | `Container — Flexbox` | `2 items` |
| Named `Hero` | `Hero` | `Flexbox · 2 items` |

`label` is Studio-only. It is not in any GROQ projection used for rendering, and
in the frontend it only ever appears as a preview-mode badge — never on a
published page.

## Related

- [schema-anatomy.md](schema-anatomy.md) — what `groups`, `fieldsets`,
  `validation` and `components.input` do, if the schema keys are unfamiliar
- `schemaTypes/fields/container.ts` — `containerField`, `advancedField`,
  `styleField`, `visibilityField`, and `CONTAINER_GROUPS`
- `components/container/` — the Layout tab's panel and controls
- `components/inputs/ColumnsInput.tsx` — the column list and "Add columns" button
- `frontend/src/lib/container.ts` — turns `container` settings into scoped CSS
- [ARCHITECTURE.md](../ARCHITECTURE.md) — how this fits the wider system
