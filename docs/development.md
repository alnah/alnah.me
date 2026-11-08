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

## GitHub activity locally

The About page renders its GitHub activity section only when live data is
available; otherwise the section is hidden.

- `make dev` and `make dev-lan` derive a token from the authenticated `gh` CLI
  when neither `GITHUB_TOKEN` nor `GH_TOKEN` is set, and never write it to disk.
- Alternatively, copy `.env.example` to `.env` and set `GITHUB_TOKEN`. Astro
  loads it into `process.env` for `dev` and `build`.
