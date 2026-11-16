import assert from "node:assert/strict";
import test from "node:test";
import {
  articlesPagePath,
  categoryPath,
  postPath,
  postSlugFromPath,
  postSocialImagePath,
  rawPostPath,
  tagPath
} from "../../src/lib/site-paths.ts";

/** Canonical path contract: URLs stay stable for readers, crawlers, feeds. */
test("site paths: canonical URL shapes", () => {
  assert.equal(postPath("cecrl"), "/articles/cecrl/");
  assert.equal(postSlugFromPath("/articles/cecrl/"), "cecrl");
  assert.equal(postSlugFromPath("/articles/"), null);
  assert.equal(postSlugFromPath("/raw/posts/cecrl.md"), null);
  assert.equal(rawPostPath("cecrl"), "/raw/posts/cecrl.md");
  assert.equal(postSocialImagePath("cecrl"), "/og/articles/cecrl.png");
  assert.equal(categoryPath("enseigner"), "/categories/enseigner/");
  assert.equal(tagPath("pedagogie"), "/etiquettes/pedagogie/");
  assert.equal(articlesPagePath(1), "/articles/");
  assert.equal(articlesPagePath(3), "/articles/3/");
});
