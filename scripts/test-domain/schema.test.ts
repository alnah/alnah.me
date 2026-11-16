import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_SCHEMA, POST_SCHEMA } from "../../src/lib/content/schema.ts";

const validPost = {
  title: "Titre",
  date: "2026-03-01",
  draft: false,
  description: "Description",
  category: "enseigner",
  tags: ["pédagogie"]
};

/** One frontmatter contract for Astro and the build scripts. */
test("schema: post frontmatter", () => {
  const post = POST_SCHEMA.parse(validPost);

  assert.equal(post.date.toISOString(), "2026-03-01T00:00:00.000Z");
  assert.equal(post.category, "enseigner");
  assert.deepEqual(post.tags, ["pédagogie"]);
  assert.equal(post.aliases, undefined);

  assert.throws(() => POST_SCHEMA.parse({ ...validPost, category: "unknown" }));
  assert.throws(() => POST_SCHEMA.parse({ ...validPost, tags: [] }));
  assert.throws(() => POST_SCHEMA.parse({ ...validPost, aliases: [42] }));
  assert.throws(() => POST_SCHEMA.parse({ ...validPost, draft: "yes" }));
});

test("schema: page frontmatter", () => {
  assert.deepEqual(PAGE_SCHEMA.parse({ title: "À propos" }), { title: "À propos" });
  assert.throws(() => PAGE_SCHEMA.parse({ description: "Sans titre" }));
});
