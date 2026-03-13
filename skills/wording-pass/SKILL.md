---
name: wording-pass
description: Improve wording, fluency, clarity, and sentence flow in explicitly mentioned Markdown files while preserving meaning, structure, and document contracts. Use when the user wants a readability pass rather than a substantive rewrite, and wants a fresh `.bak` backup created first for later diffing.
---

# Wording pass

## Overview

Use this skill for a light editorial pass on Markdown files that the user explicitly names. The goal is to make the text read better without changing the argument, the scope, or the structure.

## Workflow

1. Work only on files explicitly mentioned by the user.
2. Before editing a file:
   - delete `file.md.bak` if it already exists
   - create a new backup next to the source file
   - use [`scripts/backup_markdown.py`](scripts/backup_markdown.py) for this step
3. Edit only what improves readability:
   - clunky phrasing
   - sentence flow
   - repetition
   - vague or awkward wording
   - unnecessary verbosity
4. Preserve the document contract:
   - keep frontmatter keys and values unless the user asked to change them
   - keep headings, links, code blocks, lists, and Markdown structure intact
   - keep the language of the file intact
   - do not add or remove sections unless asked
5. Keep meaning stable:
   - do not strengthen or soften claims
   - do not rewrite the author's position
   - do not turn a wording pass into a substantive rewrite
6. When finished:
   - tell the user which files were edited
   - mention that `.bak` files are available for diffing
   - summarize only the important wording improvements

## Guardrails

- Do not edit files that were only implied by context.
- Do not touch generated files unless the user explicitly asks.
- Do not flatten the author's voice just to make the text more generic.
- If the file has severe grammar problems, fix only what is needed to complete the wording pass cleanly or recommend running `grammar-pass` first.
- If a file is not Markdown, stop and tell the user.

## Boundary with grammar-pass

- Use `wording-pass` when clarity, flow, or concision is the goal.
- Use `grammar-pass` when correctness is the goal.
- If the text has both problems, run `grammar-pass` first, then `wording-pass`.

## Example triggers

- "Tighten the wording in this draft, but don't rewrite the argument."
- "Polish the English in these Markdown files and keep backups."
- "Make this post read better without changing what I mean."

## Resource

- `scripts/backup_markdown.py`
  - delete an existing `.bak` file
  - create a fresh backup next to the source file
  - support one or more Markdown file paths
