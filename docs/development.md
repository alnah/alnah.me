# Development

Requires Node >= 23.6.0 (see `.nvmrc`); `make doctor` enforces it.

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
