---
name: grammar-pass
description: Fix grammar, spelling, punctuation, and small syntax errors in explicitly mentioned Markdown files while preserving meaning, wording choices, and structure. Use when the user asks for a grammar pass on one or more Markdown documents and wants a fresh `.bak` backup created first for later diffing.
---

# Grammar pass

## Overview

Use this skill for targeted language correction on Markdown files that the user explicitly names. The goal is to make the text correct without turning the pass into a wording or style rewrite.

## Workflow

1. Work only on files explicitly mentioned by the user.
2. Before editing a file:
   - delete `file.md.bak` if it already exists
   - create a new backup next to the source file
   - use [`scripts/backup_markdown.py`](scripts/backup_markdown.py) for this step
3. Edit only what improves correctness:
   - grammar
   - spelling
   - punctuation
   - small syntax errors
4. Preserve the document contract:
   - keep frontmatter keys and values unless the user asked to change them
   - keep headings, links, code blocks, lists, and Markdown structure intact
   - keep the language of the file intact
   - do not add new sections unless asked
5. Keep meaning stable:
   - do not strengthen or weaken claims
   - do not rewrite for tone, rhythm, or style
   - do not turn a grammar pass into a wording pass or a content rewrite
6. When finished:
   - tell the user which files were edited
   - mention that `.bak` files are available for diffing
   - summarize only the important edits

## Guardrails

- Do not edit files that were only implied by context.
- Do not touch generated files unless the user explicitly asks.
- Do not change wording only because it sounds clunky: that belongs to `wording-pass`.
- If a file is not Markdown, stop and tell the user.

## Boundary with wording-pass

- Use `grammar-pass` when correctness is the goal.
- Use `wording-pass` when clarity, flow, or concision is the goal.
- If the text has both problems, run `grammar-pass` first, then `wording-pass`.

## Example triggers

- "Fix the grammar in `DRAFT.md` and keep a backup."
- "Proofread these Markdown files, but don't rewrite them."
- "Correct the English in this post and leave me a `.bak` file."

## Resource

- `scripts/backup_markdown.py`
  - delete an existing `.bak` file
  - create a fresh backup next to the source file
  - support one or more Markdown file paths
