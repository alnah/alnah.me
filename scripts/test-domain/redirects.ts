import assert from "node:assert/strict";
import { buildAliasRedirects, buildRawAliasRedirects } from "../../src/lib/post-files.ts";

/** Alias redirects and the raw export redirects derived from them. */
export function testRedirects(): void {
  assert.deepEqual(
    buildAliasRedirects([{ slug: "a", aliases: ["old-a"] }]),
    [["/old-a/", "/articles/a/"]],
    "alias maps to the canonical post path"
  );
  assert.deepEqual(
    buildAliasRedirects([{ slug: "a", aliases: ["/articles/a/"] }]),
    [],
    "alias equal to the canonical path is skipped"
  );
  assert.deepEqual(
    buildAliasRedirects([{ slug: "a", aliases: [42, "old-a"] }]),
    [["/old-a/", "/articles/a/"]],
    "non-string aliases are ignored"
  );
  assert.deepEqual(
    buildAliasRedirects([
      { slug: "b", aliases: ["z-old"] },
      { slug: "a", aliases: ["a-old"] }
    ]),
    [
      ["/a-old/", "/articles/a/"],
      ["/z-old/", "/articles/b/"]
    ],
    "redirects are sorted by alias"
  );
  assert.throws(
    () =>
      buildAliasRedirects([
        { slug: "a", aliases: ["shared"] },
        { slug: "b", aliases: ["shared"] }
      ]),
    /Alias collision/,
    "two posts cannot claim the same alias"
  );
  assert.deepEqual(
    buildRawAliasRedirects([["/articles/old/", "/articles/new/"]]),
    [["/raw/posts/old.md", "/raw/posts/new.md"]],
    "a renamed post redirects its raw export"
  );
  assert.deepEqual(
    buildRawAliasRedirects([["/reuse-notes/", "/articles/a/"]]),
    [],
    "non-article aliases create no raw redirect"
  );
  assert.deepEqual(
    buildRawAliasRedirects([["/articles/a/", "/articles/a/"]]),
    [],
    "a self alias creates no raw redirect"
  );
}
