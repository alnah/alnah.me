# Development

Requires Node >= 23.6.0 (`engines` in `package.json`). `.nvmrc` pins the
development version; `make doctor` enforces the minimum.

```bash
make install
make dev
```

Commands:

```bash
make help
make build
make preview
make verify
```

## Markdown pipeline

`src/lib/markdown/plugins.ts` is the single list of hast plugins applied to
Markdown: Mermaid fences and external link marking. The About page renders its
fragments with the same list, so ad hoc renders match the Astro pipeline.

External links open in a new tab with `rel="noopener"`, carry an accessible
name that announces the new tab, and show a corner-up arrow. Internal links,
anchors, and `mailto:` or `tel:` targets are untouched.

## GitHub activity locally

The About page renders its GitHub activity section only when live data is
available; otherwise the section is hidden.

- `make dev` and `make dev-lan` derive a token from the authenticated `gh` CLI
  when neither `GITHUB_TOKEN` nor `GH_TOKEN` is set, and never write it to disk.
- Alternatively, copy `.env.example` to `.env` and set `GITHUB_TOKEN`. Astro
  loads it into `process.env` for `dev` and `build`.

## Sitemaps

`@astrojs/sitemap` emits `sitemap-index.xml` and `sitemap-0.xml`. `robots.txt`
and the `<link rel="sitemap">` tag point to the index. `/sitemap.xml` is the
conventional path audits and tools probe, so it 301s to the index: one
canonical entrypoint, no duplicated sitemap file.

The sitemap only lists URLs that are 200, canonical, and indexable:

- empty category archives are not generated (404) and are excluded from the
  sitemap (`src/lib/sitemap.ts`);
- `lastmod` comes from the post frontmatter (`lastmod`, else `date`), never from
  the build; archive URLs inherit the newest date of the posts they list.

## Tests

- `scripts/build-expectations.ts` derives what the build must contain from the
  Markdown, the taxonomy, and the site config.
- `scripts/test-build.ts` checks the built site against those expectations,
  reading pages through `scripts/page-dom.ts` instead of matching raw HTML.
- Unit and domain checks run with `node:test` (`*.test.ts`), independent from
  the build.
- UI checks run with Playwright Test (`playwright.config.ts`, `scripts/ui/`),
  on desktop and device projects.
