# AGENTS.md

## Principles

KISS: keep it simple and stupid.
DRY: on behaviors.
WET: on data structures.

## Source of Truth for coding

Explore: always audit the codebase, the documentation, and the relevant stack; respect language idioms before jumping into a task.
Codebase: repository root.
Documentation: `README.md`, `docs/`.
Stack: `~/workspace/stack/`; always explore the stack and third-party repos there.

## Files for coding

LOC: prefer ~500 LOC; refactor/split as needed.
Filename: never use generic names like `tools` or `utils`; never prepend the module name in the filename; always name the file from what it does.

## Symbols for coding

Style: always intention-revealing, single-meaning, stable, and readable; never vague, misleading, or noisy.
Vars: always from data.
Bools: always from state/question.
Functions: always from action.
Classes/Types: always from the thing.
Constants: always from the fixed value.
Collections: always in plural.
Events: always name from the event or effect.

## Docstrings for coding

Style: always short, specific, behavior-driven, contract-focused, clear on inputs, outputs, side effects, edge cases, units, and formats.

## Test-Driven Development for coding

Specs: always toward GRASP architecture; input = user + codebase; output = specs + todos; 1 session = 1 agent Architect; never do Red.
Red: always write failing tests; input = specs + todos; output = red tests; 1 session = 1 agent QA; never touch Specs; never do Green.
Green: always make it work correctly to satisfy specs; input = red tests + specs; output = code; 1 session = 1 agent Dev; never touch Red; never do Refactor.
Refactor-code: always toward SOLID design; input = code; output = clean code; 1 session = 1 agent Expert Dev; use `ts_symbols`, `ts_definition`, `ts_references`, `ts_rename`; never do Refactor-test.
Refactor-tests: always toward SOLID design; input = tests; output = clean tests; 1 session = 1 agent Expert QA; use `ts_symbols`, `ts_definition`, `ts_references`, `ts_rename`; never touch Refactor-code; never do Expand.
Expand: when a feature is done, always add tests for safety, edge cases, and regressions; input = user + codebase; output = a new TDD cycle; 1 session = 1 agent Architect; the loop goes on.

## Project overview

Repo: static Astro source for `https://alnah.me`.
Site: content-first blog.
Core content: Markdown posts.
Core features: local search, RSS, sitemap, social sharing, raw Markdown exports, and an About page with GitHub activity.
Visuals: already established.
Changes: favor small, testable changes over redesigns.

## Development targets

Command style: prefer the `Makefile` over ad hoc commands.
Node baseline: `.nvmrc`.
Make behavior: `make` tries to load the Node baseline through `nvm`.

Help: `make help`; show available targets.
Doctor: `make doctor`; verify Node and npm versions.
Install: `make install`; install dependencies with `npm ci`.
Prepare: `make prepare-static`; generate `_redirects`, raw Markdown exports, and license copies.
Dev: `make dev`; start Astro on localhost.
Dev LAN: `make dev-lan`; start Astro on the LAN.
Build: `make build`; build the site into `dist/`.
Preview: `make preview`; preview the built site on localhost.
Preview LAN: `make preview-lan`.
Check: `make check`.
Astro check: `make astro-check`.
Verify: `make verify`.
Acceptance: `make test-acceptance`.
Integration: `make test-integration`.
E2E: `make test-e2e`.
Clean: `make clean`.

### Playwright targets

Wrapper style: use Make wrappers, not raw Playwright CLI flags.

Install browser: `make pw-install PW_BROWSER=chromium`; install a browser for screenshot helpers.
Shot URL: `make pw-shot PW_URL=http://127.0.0.1:4321/ PW_OUT=/tmp/home.png`; take a screenshot of any URL.
Shot local: `make pw-shot-local PORT=4321 PW_PATH=/about/ PW_DEVICE='iPhone SE' PW_OUT=/tmp/about.png PW_COLOR_SCHEME=dark`; take a local screenshot with optional device emulation.

Variables: `PORT`, `HOST`, `PW_URL`, `PW_PATH`, `PW_OUT`, `PW_DEVICE`, `PW_BROWSER`, `PW_COLOR_SCHEME`, `PW_WAIT_FOR_SELECTOR`, `PW_WAIT_FOR_TIMEOUT`.

## Development workflow reminders

Prepare: if content rendering, search, metadata, or build artifacts change, also run `make prepare-static`.
Visual QA: if visual layout changes, capture desktop, `iPhone SE`, and tablet-sized screenshots.
Diffs: prefer minimal diffs.
Commits: keep atomic and reviewable.
Generated files: never commit `dist/`, `.astro/`, `public/LICENSE`, `public/LICENSES/`, `public/raw/`.
Scratch docs: never commit `docs/nocommit-*`.

## Architecture

### App structure

Pages: `src/pages/`; route entrypoints.
Layouts: `src/layouts/`; page and post shells.
Components: `src/components/`; reusable UI pieces.
Lib: `src/lib/`; content, SEO, GitHub, search, publication, and build-shared helpers.
Content: `src/content/`; Markdown content collections.
Scripts: `scripts/`; build-time preparation and verification scripts.
Public: `public/`; static assets and generated publish artifacts.

### Important boundaries

Astro app: use `TypeScript`.
Build helpers: use `.js` / `.mjs`.
Boundary: keep the split intentional.
Churn: do not move files between TS and JS without clear payoff.

### Layout model

Base layout: `BaseLayout.astro`; global shell, metadata, theme bootstrap.
Post layout: `PostLayout.astro`; post page chrome, metadata row, post footer.
Site chrome: `Header.astro` and `Footer.astro`; site-wide navigation and bottom bar.

## Post format

Location: `src/content/posts/<slug>/index.md`.
Purpose: patch content fixtures and respect schema contracts when changing build or rendering logic.
Authoring guide: `README.md`.

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

Optional fields: `lastmod`, `aliases`, `publishDate`, `expiryDate`, `cover`.

Title contract: Markdown must start with a leading `# H1`.
Title contract: `# H1` must match YAML `title`.
Rendering: the site uses the document `H1` as the rendered post title.
Summary: `description` is the feed/card summary.

Legacy mapping:

```md
---
public: yes
tags: [tag1, tag2]
summary: Brief description for feeds
---

# Post Title
```

Mapping: `public: yes` -> `draft: false`.
Mapping: `summary` -> `description`.
Schema rule: do not introduce `public` or `summary` unless the content schema changes first.

## Build system

Prepare script: `scripts/prepare-static.mjs`; validate Markdown title contracts, generate `public/_redirects`, copy `LICENSE` and `LICENSES/`, generate raw reusable Markdown under `public/raw/posts/`.
Acceptance: `scripts/test-acceptance.mjs`.
Integration: `scripts/test-integration.mjs`.
E2E: `scripts/test-e2e.mjs`.
Verify: `scripts/verify.mjs`.

## Deployment

Platform: Cloudflare Pages.
Build command: `make build`.
Build output: `dist/`.
Analytics token: `PUBLIC_CF_WEB_ANALYTICS_TOKEN`.
Beacon: `src/components/Analytics.astro`.
Redirect rule: configure `www -> apex` in Cloudflare, not in `public/_redirects`.
Reason: Workers asset redirects only allow relative targets.

## Frontend features

Theme: light, dark, and auto/system theme toggle.
Shortcut: keyboard search shortcut `/`.
Reading time: on post listings and post pages.
Contacts: icon rows in hero and footer.

## Special pages

Home: `/`; hero and recent posts.
Posts: `/posts/`; paginated archive.
Post: `/posts/[slug]/`; single post.
Tag: `/tags/[tag]/`; tag archive.
About: `/about/`; GitHub activity.
Privacy: `/privacy/`.
Not found: `/404.html`.
RSS: `/rss.xml`.
Robots: `/robots.txt`.
Search index: `/index.json`.

## Content management

Posts: load from `src/content/posts/**`.
Pages: load from `src/content/pages/**`.
Schema: `src/content.config.ts`.
Publication: `src/lib/publication.js`.
Raw exports: generate only for published posts.
Aliases: generate redirects from frontmatter `aliases`.
Site metadata: centralize contact links and site metadata in `src/config/site.ts`.

## Testing and release expectations

Done rule: a change is not done if `make verify` breaks.
HTML changes: verify metadata, search behavior, raw Markdown exports, and mobile rendering.
Pipeline: prefer fixing the build/test pipeline over bypassing it.
