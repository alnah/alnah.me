# Titles and branding

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
- System pages:
  - `src/pages/index.astro`
  - `src/pages/articles/[...page].astro`
  - `src/pages/categories/index.astro`
  - `src/pages/categories/[category].astro`
  - `src/pages/etiquettes/[tag].astro`
  - `src/pages/404.astro`
