# Styles

CSS lives in `src/styles/` and is organized in cascade layers, declared once in
`global.css`:

- `fonts.css`: font faces and subsets.
- `tokens.css`: design tokens, split into primitives and semantic roles, plus
  the dark theme.
- `reset.css`: element resets.
- `base.css`: document defaults and focus styles.
- `layout.css`: page containers and the reading column.
- `primitives.css`: shared UI primitives such as control pills, social rows and
  category pills.
- `prose.css`: rendered Markdown typography.
- `mermaid.css`: diagram figures and the zoom dialog.
- `utilities.css`: single-purpose helpers.

Component styles stay scoped in `.astro` `<style>` blocks and, being unlayered,
always win over the layered global styles.
