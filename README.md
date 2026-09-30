# Sanity Astro Page Builder

An Elementor-style visual page builder for **Sanity + Astro**.

28 content blocks, nested flex/grid containers with per-breakpoint control,
custom Studio inputs, and full visual editing through Sanity's Presentation tool.

The Studio ships custom inputs for the whole editing surface: a visual layout
picker, responsive spacing controls with link/unlink, colour pickers and live
block previews.

## Structure

```
├── studio/       Sanity Studio (port 3333)
├── frontend/     Astro SSR app (port 4321)
└── package.json  npm workspace root
```

Both packages are npm workspaces of the repo root, so `npm install` at the top
level installs everything.

For how the pieces fit together — request path, content model, render chain and
the preview loops — see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp studio/.env.example studio/.env
cp frontend/.env.example frontend/.env
```

Fill in your Sanity project ID and dataset in both files.

| Package | Variable | Purpose |
| --- | --- | --- |
| studio | `SANITY_STUDIO_PROJECT_ID` | Sanity project |
| studio | `SANITY_STUDIO_DATASET` | usually `production` |
| studio | `SANITY_STUDIO_PREVIEW_URL` | where Presentation points, defaults to `http://localhost:4321` |
| frontend | `PUBLIC_SANITY_PROJECT_ID` | same project |
| frontend | `PUBLIC_SANITY_DATASET` | same dataset |
| frontend | `SANITY_API_READ_TOKEN` | **required** for draft mode and visual editing |
| frontend | `SANITY_REVALIDATE_SECRET` | on-demand revalidation webhook |

Create the read token in [Sanity Manage](https://sanity.io/manage) → API → Tokens,
with **Viewer** permissions.

### 3. Seed content (optional)

```bash
npm run seed                          # asks which dataset to import into
npm run seed -- --dataset staging     # or name it
```

Imports `studio/seed/content.tar.gz`: the site's published content and images.
Documents with the same ID are replaced, so it's safe to run again. To refresh
the snapshot from the current dataset:

```bash
npm run seed:export
```

### 4. Run

```bash
npm run dev     # both packages
npm run stop    # frees ports 4321 and 3333
```

- **Site:** [http://localhost:4321](http://localhost:4321)
- **Studio:** [http://localhost:3333](http://localhost:3333)

## Editing and preview

Open any page or post in the Studio and use **Open in Presentation** to see it
live, side by side with the form. Clicking an element in the preview selects it in
the Studio; edits appear without a manual refresh.

To preview drafts in an ordinary browser tab during development, visit
`/api/draft-mode/enable?dev=1`. The **Exit Preview** button, or
`/api/draft-mode/disable`, turns it back off.

## Content blocks

Hero Section, Container (grid/flex row), Call to Action, Rich Text, Image, Image
Gallery, FAQ, Form, Feature Card Grid, Testimonial Carousel, Testimonial Quote,
Accordion, Tabbed Content, Button Group, Icon Text, Stat Metric, Pricing Card,
Alert Notice, Code Block, Data Table, Social Embed, Logo Row, Map Embed, Countdown
Timer, Lottie Animation, Spacer/Divider, Table of Contents.

Containers nest: a row holds columns, a column holds blocks, and layout, style,
spacing and visibility are all set per breakpoint — **desktop-first**, with Tablet
overriding at ≤1024px and Mobile at ≤767px.

## Type safety

GROQ results are typed via [Sanity TypeGen](https://www.sanity.io/docs/sanity-typegen).
Regenerate after schema changes:

```bash
npm run typegen
```

Output lands in `frontend/src/sanity/types.generated.ts` — never edit it by hand.
Hand-written aliases live alongside it in `frontend/src/types/sanity.ts`, which is
what application code imports.

## Deployment

### Studio

```bash
npm run deploy:studio
```

### Site

Deploy the `frontend/` directory to Vercel. Set the **Root Directory** to
`frontend` in your hosting provider.

The Astro config uses `@astrojs/vercel` with ISR (24-hour expiry). Draft requests
bypass the cache via the `__prerender_bypass` cookie, so previews are never served
stale.

Remember to add your deployed site's origin to the project's **CORS origins** in
[Sanity Manage](https://sanity.io/manage) → API, or live updates will silently
fail on the published site.

### Validate the template

```bash
npm run validate
```

## Instant updates on publish

Pages are cached by ISR. For updates to appear within seconds of an editor
publishing, set up the webhook:

1. Generate a secret: `openssl rand -hex 32`
2. Add `SANITY_REVALIDATE_SECRET` to your hosting env vars
3. In [Sanity Manage](https://sanity.io/manage) → API → Webhooks, create a webhook:
   - **URL:** `https://your-domain.com/api/revalidate`
   - **Secret:** the secret from step 1
   - **Filter:** `_type in ["homePage", "page", "practiceArea", "siteSettings", "siteSettingsEs"]`
   - **Projection:** `{_id, _type, slug, language}`

   `language` is what sends a Spanish page's refresh to `/es/…`; without it,
   Spanish pages refresh their English address instead.

## More info

- [Astro docs](https://docs.astro.build)
- [Sanity Presentation tool](https://www.sanity.io/docs/presentation)
- [Create your own Sanity template](https://www.sanity.io/docs/create-your-own-sanity-template)
- [#template-creators on Sanity Slack](https://slack.sanity.io)

## License

MIT
