import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PUBLISHED_POSTS } from "../build-expectations.ts";
import { attr, elements, parsePage } from "../page-dom.ts";
import { assertInternalLinks, htmlFiles, readFile } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Raw exports, social images, licenses, ids, links, and indexability. */
export function checkArtifacts({ license }: BuiltSite): void {
  // Every published post owns exactly one raw export and social image.
  assert.deepEqual(
    fs.readdirSync(path.join(process.cwd(), "dist/raw/posts")).sort(),
    PUBLISHED_POSTS.map((post) => `${post.slug}.md`).sort(),
    "raw exports match the published posts"
  );
  assert.deepEqual(
    fs.readdirSync(path.join(process.cwd(), "dist/og/articles")).sort(),
    PUBLISHED_POSTS.map((post) => `${post.slug}.png`).sort(),
    "social images match the published posts"
  );
  // Duplicate ids break anchors and accessibility.
  for (const file of htmlFiles()) {
    const dom = parsePage(readFile(path.relative(process.cwd(), file)));
    const ids = elements(dom, (element) => attr(element, "id") !== undefined).map((element) =>
      attr(element, "id")
    );
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${path.relative(process.cwd(), file)} must not contain duplicate ids`
    );
  }

  assertInternalLinks();

  // Sitemap contract: no indexable URL is noindex, and no built page is noindex.
  for (const htmlPath of htmlFiles()) {
    assert.ok(
      !readFile(path.relative(process.cwd(), htmlPath)).includes("noindex"),
      `${path.relative(process.cwd(), htmlPath)} must stay indexable`
    );
  }
  assert.equal(license, readFile("LICENSE"), "LICENSE is copied byte for byte");
  assert.deepEqual(
    fs.readdirSync("dist/LICENSES").sort(),
    fs.readdirSync("LICENSES").sort(),
    "LICENSES directory is copied as a whole"
  );
  for (const name of fs.readdirSync("LICENSES")) {
    assert.equal(
      readFile(`dist/LICENSES/${name}`),
      readFile(`LICENSES/${name}`),
      `${name} is copied byte for byte`
    );
  }
}
