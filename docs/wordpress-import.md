# WordPress import

`studio/scripts/import-wordpress.ts` (the pieces are in `studio/scripts/wordpress/`)

Copies the WordPress site (thesandersfirm.com) into Sanity from a WordPress
export file. It only reads the file: WordPress itself is never touched.

| WordPress | Sanity |
| --- | --- |
| Pages | Pages |
| Pages with Page Type "Practice Area" | Practice Areas (intro, office, related pages, card image) |
| News | News posts, with their categories |
| Case results | Case Results |
| Attorneys | Lawyers |
| Testimonials | Reviews |
| Elementor sections / columns / widgets | Containers / Columns / blocks |
| Images | Uploaded once each |
| English + Spanish (Polylang) | Linked translations |

## Before the first run

1. **Export from WordPress:** Tools → Export → All content → Download Export File.
2. **Put the file in the project folder**, e.g. `sanders-export.xml`. Git ignores
   `.xml` files there, so it won't be committed.
3. **Log in to Sanity once:**

   ```bash
   npm run stop                              # Sanity's login uses port 4321, like the dev server
   cd studio && npx sanity login && cd ..
   ```

## Commands

Run from the project folder.

```bash
# See what it would import, without writing anything
npm run import:wp -- --xml=sanders-export.xml --dry

# Import as drafts (nothing shows on the site until published in the Studio)
npm run import:wp -- --xml=sanders-export.xml

# Import and publish straight away
npm run import:wp -- --xml=sanders-export.xml --publish

# Remove everything the import created (add --dry to only count it)
npm run import:wp:undo
```

### One kind at a time

Each line imports as drafts; add `--dry` to see it first, or `--publish` to
publish straight away.

```bash
# Pages and Practice Areas
npm run import:wp -- --xml=sanders-export.xml --only=pages

# News posts, with their categories
npm run import:wp -- --xml=sanders-export.xml --only=posts

# Case Results
npm run import:wp -- --xml=sanders-export.xml --only=case-results

# Lawyers
npm run import:wp -- --xml=sanders-export.xml --only=lawyers

# Reviews (testimonials)
npm run import:wp -- --xml=sanders-export.xml --only=testimonials
```

### Trying a few first

```bash
# The first 5 pages in English, plus their Spanish versions
npm run import:wp -- --xml=sanders-export.xml --only=pages --limit=5 --dry

# One page or post, by its slug
npm run import:wp -- --xml=sanders-export.xml --slug=queens-premises-liability-lawyer --dry

# Everything, including what Sanity already has (replaces nothing; adds copies)
npm run import:wp -- --xml=sanders-export.xml --include-existing --dry
```

### Undo

```bash
# Count what would be deleted
npm run import:wp:undo -- --dry

# Delete everything the import created (drafts and published)
npm run import:wp:undo
```

## Options

Add them after `--`, e.g. `npm run import:wp -- --xml=sanders-export.xml --only=pages --limit=5 --dry`.

| Option | What it does |
| --- | --- |
| `--xml=file.xml` | The export file. Required, except for `--undo`. |
| `--dry` | Write nothing and upload no images. The result is saved to `studio/scripts/.wp-import/` to check. |
| `--publish` | Publish what it imports, instead of making drafts. |
| `--only=pages` | Only one kind: `pages`, `posts` (News), `case-results`, `lawyers` or `testimonials`. |
| `--limit=5` | Only the first 5 in English, plus their Spanish versions. |
| `--slug=about-us` | Only the page or post with this slug. |
| `--include-existing` | Also import what Sanity already has (see below). |
| `--undo` | Delete everything an import created. |

`WP_UPLOADS_DIR` in `studio/.env` can point at a downloaded copy of
`wp-content/uploads`, so images are read from it instead of downloaded.

## Good to know

- **Running it again is safe.** Every document's id comes from its WordPress
  id (`wp-page-12`, `wp-post-34`, `wp-case-56`, …), so a second run updates the
  same documents instead of making copies. Uploaded images are reused.
- **What's already in Sanity is kept.** Pages at the same address, and Lawyers,
  Reviews and Case Results with the same name, are skipped and listed in the
  report. Links to them (e.g. a practice area's related pages) point at the
  existing ones instead. `--include-existing` imports them anyway.
- **Lawyers, Reviews and Case Results already in Sanity get their empty
  fields filled** from WordPress (e.g. a lawyer's bio and Spanish bio). Fields
  that already have something are never changed. The undo doesn't reverse
  this, since it only removes `wp-` documents; clear a field in the Studio if
  you don't want it.
- **The undo only removes what the import made**: documents whose id starts
  with `wp-`. Documents made in the Studio are left alone, and so are uploaded
  images.
- **Styling doesn't come over**, only content: Elementor's colors, spacing and
  fonts are left behind, since the new site has its own design.

## After importing

The script prints a report (also saved to `studio/scripts/.wp-import/report.json`)
of what to check or finish by hand. Usually:

- **Intro Text** on Practice Areas whose WordPress intro was empty: copied from
  the first paragraph, so check it.
- **Case Results carousels** and **forms**: add a Case Results or Form block.
- **Review ratings**: WordPress has none, so every review is 5 stars.
- **Pages whose parent isn't imported**: set the Parent Page in the Studio.

## If something goes wrong

| Message | Fix |
| --- | --- |
| `no auth token could be found` | Log in to Sanity (see above). |
| The login opens a 404 page | The dev server is using port 4321: `npm run stop`, then log in again. |
| `Missing script: "import:wp"` | Run it from the project folder. |
| `cannot be deleted as there are references to it` (undo) | Something made in the Studio links to an imported document, e.g. a Default Content Reviewer in Site Settings. Remove the link, then undo again. |
