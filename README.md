# alnah.me

Static Astro blog by Alexis Nahan.

The site focuses on solo building, product engineering, technical writing, and
open source work. It uses a custom theme built specifically for `alnah.me`.

## Structure

- `src/content/`
  Markdown posts and standalone pages
- `src/pages/`
  routes and special pages such as home, posts, tags, about, privacy, RSS,
  `robots.txt`, and `index.json`
- `src/components/`
  reusable UI components
- `src/layouts/`
  shared page and post layouts
- `src/assets/`
  local assets used by the site
- `public/`
  static files and generated publish artifacts
- `scripts/`
  build-time helpers and verification scripts

## Writing posts

Posts live in `src/content/posts/<slug>/index.md`.

Required frontmatter:

```md
---
title: "Post Title"
date: 2026-03-01
draft: false
description: "Brief description for feeds and cards."
tags:
  - tag1
  - tag2
---

# Post Title

Content in Markdown format...
```

Optional frontmatter:

```md
lastmod: 2026-03-02
aliases:
  - /old-post/
publishDate: 2026-03-01
expiryDate: 2026-12-31
cover: ./cover.jpg
```

- the Markdown body must start with a leading `# H1`
- the H1 must match the frontmatter `title`
- `description` is the summary used for feeds, cards, and search previews
- `draft: false` means the post is public

## Changing titles and branding

If you want to change the text that appears in the browser tab or page metadata:

- Global site name and author metadata:
  - `src/config/site.ts`
- How page titles are formatted in the browser tab:
  - `src/lib/seo.ts`
- Post titles:
  - `src/content/posts/<slug>/index.md`
  - keep the YAML `title` and the Markdown `# H1` identical
- Standalone content pages such as `About` and `Privacy`:
  - `src/content/pages/about.md`
  - `src/content/pages/privacy.md`
- System pages such as home, archive, tags, and `404`:
  - `src/pages/index.astro`
  - `src/pages/posts/[...page].astro`
  - `src/pages/tags/[tag].astro`
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

## Deployment

This repo is intended to be deployed on Cloudflare Pages, not GitHub Pages.

Recommended Cloudflare Pages settings:

- Production branch: `main`
- Build command: `make build`
- Build output directory: `dist`

If you want Cloudflare Web Analytics enabled, set this environment variable in
the Pages project:

```bash
PUBLIC_CF_WEB_ANALYTICS_TOKEN=your_token_here
```

Notes:

- the site already ships `public/_headers` and `public/_redirects`
- configure `www -> apex` in Cloudflare, not in `_redirects`, because Workers asset redirects only allow relative targets
- the analytics beacon is loaded only when `PUBLIC_CF_WEB_ANALYTICS_TOKEN` is set
