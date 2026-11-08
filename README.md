# alnah.me

## Documentation

- [Structure](docs/structure.md)
- [Titles](docs/titles.md)
- [Diagrams](docs/diagrams.md)
- [Development](docs/development.md)
- [Styles](docs/styles.md)

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

- the body must start with a `# H1` matching the frontmatter `title`
- `description` is the summary used for feeds, cards, and search previews
- `category` is required; allowed values live in `src/lib/content/taxonomy.ts`
- `draft: false` means the post is public
