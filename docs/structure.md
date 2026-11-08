# Structure

- `src/content/`
  Markdown posts and pages
- `src/pages/`
  routes such as home, articles, categories, tags, about, privacy, RSS,
  `robots.txt`, and `index.json`
- `src/components/`
  UI components
- `src/layouts/`
  page and post layouts
- `src/assets/`
  local assets
- `public/`
  static files and generated publish artifacts
- `scripts/`
  build and verification scripts

## Changing titles and branding

Where to change site, page, and post titles:

- Global site name and author metadata:
  - `src/config/site.ts`
- How page titles are formatted in the browser tab:
  - `src/lib/seo.ts`
- Post titles:
  - `src/content/posts/<slug>/index.md`
  - keep the YAML `title` and the Markdown `# H1` identical
- Standalone content pages such as `About` and `Privacy`:
  - `src/content/pages/a-propos.md`
  - `src/content/pages/confidentialite.md`
- System pages such as home, archive, categories, tags, and `404`:
  - `src/pages/index.astro`
  - `src/pages/articles/[...page].astro`
  - `src/pages/categories/index.astro`
  - `src/pages/categories/[category].astro`
  - `src/pages/etiquettes/[tag].astro`
  - `src/pages/404.astro`
