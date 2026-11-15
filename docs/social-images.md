# Social images

Each published post gets a generated 1200x630 PNG at build time.

- Route: `src/pages/og/articles/[slug].png.ts`
- URL: `/og/articles/<slug>.png`
- Output: `dist/og/articles/<slug>.png`
- Renderer: `src/lib/social-image.ts`
- Text fitting: `src/lib/text-fit.ts`

The image uses the site palette and Fira Sans. It contains the post title, the
description, the profile photo in a circular mask, and the author name. The
photo is not cropped; the circle only masks its corners. Titles are capped at
two lines and descriptions at three lines through `truncateText`, which cuts at
word boundaries.

`PostLayout` points `og:image`, `og:image:width`, and `og:image:height` to the
generated file for every post. Pages without a generated image keep the
`/og-default.jpg` fallback.

Preview in development:

```bash
make dev
open http://127.0.0.1:4321/og/articles/cecrl.png
```
