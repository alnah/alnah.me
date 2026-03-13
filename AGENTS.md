# AGENTS.md

This file is for coding agents and automation.

- `README.md` is the short human-facing guide: project overview, structure,
  authoring, and basic development commands.
- `AGENTS.md` is the execution guide: workflow expectations, architecture,
  build/test commands, and repository-specific constraints for agents.

## Project overview

- This repository contains the static Astro source for `https://alnah.io`.
- The site is a content-first blog with:
  - Markdown posts
  - local search
  - RSS and sitemap
  - social sharing on posts
  - reusable raw Markdown exports
  - an `About` page with GitHub activity
- The visual system is already established. Favor small, testable changes over redesigns.

## Development targets

Prefer the `Makefile` over ad hoc commands. `.nvmrc` currently records a known-good Node baseline, and `make` will try to load it through `nvm`.

- `make help`
  - show available targets
- `make doctor`
  - verify Node and npm versions
- `make install`
  - install dependencies with `npm ci`
- `make prepare-static`
  - generate `_redirects`, raw Markdown exports, and license copies
- `make dev`
  - start Astro on localhost
- `make dev-lan`
  - start Astro on the LAN
- `make build`
  - build the site into `dist/`
- `make preview`
  - preview the built site on localhost
- `make preview-lan`
  - preview the built site on the LAN
- `make check`
  - run the current green quality gate
- `make astro-check`
  - run stricter Astro diagnostics; useful, but not the repo’s current green gate
- `make verify`
  - run the full build + acceptance/integration/e2e verification suite
- `make test-acceptance`
- `make test-integration`
- `make test-e2e`
- `make clean`
  - remove generated build artifacts

### Playwright targets

Use the Make wrappers instead of remembering the Playwright CLI flags.

- `make pw-install PW_BROWSER=chromium`
  - install a browser used by the screenshot helpers
- `make pw-shot PW_URL=http://127.0.0.1:4321/ PW_OUT=/tmp/home.png`
  - take a screenshot of any URL
- `make pw-shot-local PORT=4321 PW_PATH=/about/ PW_DEVICE='iPhone SE' PW_OUT=/tmp/about.png PW_COLOR_SCHEME=dark`
  - take a screenshot of the local site with optional device emulation

Useful variables:
- `PORT`
- `HOST`
- `PW_URL`
- `PW_PATH`
- `PW_OUT`
- `PW_DEVICE`
- `PW_BROWSER`
- `PW_COLOR_SCHEME`
- `PW_WAIT_FOR_SELECTOR`
- `PW_WAIT_FOR_TIMEOUT`

## Development workflow reminders

- Use `make verify` before finishing meaningful changes.
- If you touch content rendering, search, metadata, or build artifacts, also run `make prepare-static`.
- If you touch visual layout, capture the affected pages on at least:
  - desktop
  - `iPhone SE`
  - a tablet-sized device
- Prefer minimal diffs. Keep commits atomic and reviewable.
- Do not commit generated files from:
  - `dist/`
  - `.astro/`
  - `public/LICENSE`
  - `public/LICENSES/`
  - `public/raw/`
- Do not commit `docs/nocommit-*`.

## Architecture

### App structure

- `src/pages/`
  - route entrypoints
- `src/layouts/`
  - page and post shells
- `src/components/`
  - reusable UI pieces
- `src/lib/`
  - content, SEO, GitHub, search, publication, and build-shared helpers
- `src/content/`
  - Markdown content collections
- `scripts/`
  - build-time preparation and verification scripts
- `public/`
  - static assets and generated publish artifacts

### Important boundaries

- `TypeScript` is used for the Astro app layer.
- `.js` / `.mjs` is used for Node/build helpers and scripts.
- This split is intentional. Do not churn files between TS and JS without a clear payoff.

### Layout model

- `BaseLayout.astro`
  - global shell, metadata, theme bootstrap
- `PostLayout.astro`
  - post page chrome, metadata row, post footer
- `Header.astro` and `Footer.astro`
  - site-wide navigation and bottom bar

## Post format

Posts live under `src/content/posts/<slug>/index.md`.

This section exists because agents often need to patch content fixtures or
respect schema contracts while changing the build or rendering logic. The
human-facing authoring version lives in `README.md`.

Current required frontmatter:

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

Optional frontmatter fields supported by the current schema:
- `lastmod`
- `aliases`
- `publishDate`
- `expiryDate`
- `cover`

Important title contract:
- the Markdown document must start with a leading `# H1`
- that H1 must match the YAML `title`
- the site uses that document H1 as the rendered post title
- `description` currently plays the role of feed/card summary

If you are thinking in terms of:

```md
---
public: yes
tags: [tag1, tag2]
summary: Brief description for feeds
---

# Post Title
```

map that to the current schema as:
- `public: yes` -> `draft: false`
- `summary` -> `description`

Do not introduce `public` or `summary` unless the content schema is changed first.

## Build system

- `scripts/prepare-static.mjs`
  - validates Markdown title contracts
  - generates `public/_redirects`
  - copies `LICENSE` and `LICENSES/`
  - generates raw reusable Markdown files under `public/raw/posts/`
- Astro build outputs to `dist/`
- Verification lives in:
  - `scripts/test-acceptance.mjs`
  - `scripts/test-integration.mjs`
  - `scripts/test-e2e.mjs`
  - `scripts/verify.mjs`

## Deployment

- Target platform: Cloudflare Pages
- Recommended build command: `make build`
- Build output directory: `dist`
- Cloudflare Web Analytics is wired through `PUBLIC_CF_WEB_ANALYTICS_TOKEN`
- The runtime beacon is rendered by `src/components/Analytics.astro`
- `public/_redirects` already includes the `www -> apex` redirect for `alnah.io`

## Frontend features

- Local search from `/index.json`
- Theme toggle with light, dark, and auto/system behavior
- Keyboard search shortcut `/`
- Reading time on post listings and post pages
- Social sharing icons on posts
- Contact icon rows in hero and footer
- RSS feed at `/rss.xml`
- GitHub activity block on `About`

## Special pages

- `/`
  - home page with hero and recent posts
- `/posts/`
  - paginated archive
- `/posts/[slug]/`
  - single post
- `/tags/[tag]/`
  - tag archive
- `/about/`
  - about page with GitHub activity
- `/privacy/`
  - privacy page
- `/404.html`
  - not found page
- `/rss.xml`
- `/robots.txt`
- `/index.json`

## Content management

- Posts are loaded from `src/content/posts/**`
- Fixed pages are loaded from `src/content/pages/**`
- The schema is defined in `src/content.config.ts`
- Published content is filtered through publication rules in `src/lib/publication.js`
- Raw Markdown reuse exports are generated only for published posts
- Alias redirects are generated from frontmatter `aliases`
- Contact links and site metadata are centralized in `src/config/site.ts`

## Testing and release expectations

- A change is not done if it breaks `make verify`.
- If a change alters the public HTML structure, verify:
  - metadata
  - raw Markdown exports
  - search behavior
  - mobile rendering
- Prefer fixing the build/test pipeline rather than bypassing it.
