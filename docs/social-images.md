# Social images

Every indexable page gets a generated 1200x630 PNG at build time. The route
mirrors the canonical page path under `/og/`.

- Route: `src/pages/og/[...path].png.ts`
- Renderer: `src/lib/social-image.ts`
- Text fitting: `src/lib/text-fit.ts`
- Path helper: `src/lib/site-paths.ts`

| Page | Page path | Image |
| --- | --- | --- |
| Home | `/` | `/og/index.png` |
| Articles archive | `/articles/` | `/og/articles.png` |
| Post | `/articles/<slug>/` | `/og/articles/<slug>.png` |
| About | `/a-propos/` | `/og/a-propos.png` |
| Categories index | `/categories/` | `/og/categories.png` |
| Category archive | `/categories/<category>/` | `/og/categories/<category>.png` |
| Tag archive | `/etiquettes/<tag>/` | `/og/etiquettes/<tag>.png` |
| Privacy | `/confidentialite/` | `/og/confidentialite.png` |

Paginated article archives reuse `/og/articles.png`: their title and
description do not change with the page number. The 404 page keeps
`/og-default.jpg`; an error URL is neither indexed nor shared.

Metadata comes from the same source as the page:

- Home: `SITE.title` and `SITE.description`
- Posts: document title and frontmatter `description`
- About and privacy: content title and frontmatter `description`
- Archives: `src/lib/content/archive-meta.ts`, taxonomy labels, and tag labels

The image uses the site palette and Fira Sans. It contains the page title, the
description, the profile photo in a circular mask, and the author name. The
photo is not cropped; the circle only masks its corners. Titles are capped at
72 characters and descriptions at 200 through `truncateText`, which cuts at
word boundaries.

`BaseLayout` derives `og:image:width` and `og:image:height` for paths under
`/og/`, and uses `Image de partage pour <title>.` as the default alt text.
`scripts/test-build/social-images.ts` checks file parity, dimensions, and meta
wiring for every indexable page.

Preview in development:

```bash
make dev
open http://127.0.0.1:4321/og/index.png
open http://127.0.0.1:4321/og/articles/cecrl.png
open http://127.0.0.1:4321/og/etiquettes/pedagogie.png
```
