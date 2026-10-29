# alnah.me

Static Astro source for alnah.me.

## Structure

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

## Writing posts

Posts live in `src/content/posts/<slug>/index.md`.

Required frontmatter:

```md
---
title: 'Post Title'
date: 2026-03-01
draft: false
description: 'Brief description for feeds and cards.'
category: enseigner
tags:
  - tag1
  - tag2
---

# Post Title

Content in Markdown format...
```

Optional frontmatter:

```md
---
lastmod: 2026-03-02
aliases:
  - /old-post/
publishDate: 2026-03-01
expiryDate: 2026-12-31
cover: ./cover.jpg
---
```

- the Markdown body must start with a leading `# H1`
- the H1 must match the frontmatter `title`
- `description` is the summary used for feeds, cards, and search previews
- `category` is required; one of `construire`, `outils`, `enseigner`, `travailler`, `penser`
- `draft: false` means the post is public

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

## Development

Quick start:

```bash
make install
make dev
```

Useful commands:

```bash
make help
make build
make preview
make verify
```

### GitHub activity locally

The About page renders its GitHub activity section only when live data is
available; otherwise the section is hidden.

- `make dev` and `make dev-lan` derive a token from the authenticated `gh` CLI
  when neither `GITHUB_TOKEN` nor `GH_TOKEN` is set, and never write it to disk.
- Alternatively, copy `.env.example` to `.env` (gitignored) and set
  `GITHUB_TOKEN`. Astro loads it into `process.env` for `dev` and `build`.

## Styles

CSS lives in `src/styles/` and is organized in cascade layers, declared once in
`global.css`:

- `tokens.css`: design tokens, split into primitives and semantic roles, plus
  the dark theme.
- `reset.css`: element resets.
- `base.css`: document defaults and focus styles.
- `layout.css`: page containers and the reading column.
- `primitives.css`: shared UI primitives such as control pills, social rows and
  category pills.
- `prose.css`: rendered Markdown typography.
- `utilities.css`: single-purpose helpers.

Component styles stay scoped in `.astro` `<style>` blocks and, being unlayered,
always win over the layered global styles.
