import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { CLASS_HOOKS, UNSTYLED_HOOKS } from "../../src/lib/dom-hooks.ts";

const srcDir = path.join(process.cwd(), "src");

function listFiles(dir: string, extension: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(fullPath, extension);
    }

    return entry.name.endsWith(extension) ? [fullPath] : [];
  });
}

function styleSources(): string {
  const css = listFiles(path.join(srcDir, "styles"), ".css").map((file) =>
    fs.readFileSync(file, "utf8")
  );
  const componentStyles = listFiles(srcDir, ".astro").flatMap((file) =>
    [...fs.readFileSync(file, "utf8").matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
      (match) => match[1]
    )
  );

  return [...css, ...componentStyles].join("\n");
}

/** Every class hook is styled, or explicitly declared as a bare marker. */
test("dom hooks: every class is styled or declared unstyled", () => {
  const styles = styleSources();
  const hooks = new Set(CLASS_HOOKS);

  assert.equal(hooks.size, CLASS_HOOKS.length, "class hooks are unique");

  for (const hook of CLASS_HOOKS) {
    const escaped = hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const selector = new RegExp(`\\.${escaped}(?![\\w-])`);
    const styled = selector.test(styles);
    const declaredUnstyled = UNSTYLED_HOOKS.includes(hook);

    assert.equal(
      styled,
      !declaredUnstyled,
      declaredUnstyled
        ? `hook ${hook} is declared unstyled but has a style`
        : `hook ${hook} has no style`
    );
  }
});
