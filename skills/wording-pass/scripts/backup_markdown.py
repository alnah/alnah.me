#!/usr/bin/env python3

"""Create fresh .bak copies next to Markdown files before a wording pass.

Why:
- the user wants a diffable snapshot of the pre-edit state
- replacing an old backup avoids comparing against stale content
- keeping the backup next to the source keeps the workflow obvious
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: backup_markdown.py <file.md> [more.md ...]", file=sys.stderr)
        return 2

    for raw_path in argv[1:]:
        path = Path(raw_path).expanduser()
        if not path.exists():
            raise FileNotFoundError(f"file not found: {path}")
        if path.suffix.lower() != ".md":
            raise ValueError(f"not a markdown file: {path}")

        backup_path = path.with_name(path.name + ".bak")
        if backup_path.exists():
            backup_path.unlink()

        shutil.copy2(path, backup_path)
        print(f"backup created: {backup_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
