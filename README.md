# alnah.me

Static Astro source for alnah.me.

## Documentation

- [Structure](docs/structure.md): project layout and where to change titles
- [Diagrams](docs/diagrams.md): Mermaid authoring contract and implementation
- [Development](docs/development.md): setup, commands, GitHub activity
- [Styles](docs/styles.md): cascade layers and component styles

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

Diagrams use a dedicated accessibility contract, documented in
[docs/diagrams.md](docs/diagrams.md).
