import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEmptyCategoryPaths,
  buildSitemapMetadata
} from "../../src/lib/sitemap.ts";
import { POST_CATEGORIES } from "../../src/lib/content/taxonomy.ts";

/** Paths are compared as sorted arrays: the set order is not a contract. */
function sortedPaths(posts: Array<{ category?: string }>) {
  return [...buildEmptyCategoryPaths(posts)].sort();
}

function categoryPath(category: string) {
  return `/categories/${category}/`;
}

function isoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

test('sitemap: empty categories and lastmod', () => {
  assert.deepEqual(
    sortedPaths([]),
    POST_CATEGORIES.map(categoryPath).sort(),
    "every category is empty without posts"
  );

  assert.deepEqual(
    sortedPaths([{ category: "enseigner" }]),
    POST_CATEGORIES.filter((category) => category !== "enseigner")
      .map(categoryPath)
      .sort(),
    "a populated category leaves the empty set"
  );

  assert.deepEqual(
    sortedPaths([{ category: "enseigner" }, { category: "construire" }]),
    POST_CATEGORIES.filter(
      (category) => category !== "enseigner" && category !== "construire"
    )
      .map(categoryPath)
      .sort(),
    "each populated category is excluded on its own"
  );

  assert.deepEqual(
    sortedPaths([{ category: "unknown" }]),
    POST_CATEGORIES.map(categoryPath).sort(),
    "unknown categories do not populate the taxonomy"
  );

  const single = buildSitemapMetadata(
    [
      {
        slug: "cecrl",
        category: "enseigner",
        tags: ["Pédagogie"],
        date: new Date("2026-11-06T00:00:00Z"),
        lastmod: new Date("2026-11-15T00:00:00Z")
      }
    ],
    { pageSize: 6 }
  );

  assert.deepEqual(
    single.lastmodByPath.get("/articles/cecrl/"),
    isoDate("2026-11-15"),
    "the post uses lastmod when it is newer than date"
  );
  assert.deepEqual(
    single.lastmodByPath.get("/etiquettes/pedagogie/"),
    isoDate("2026-11-15"),
    "tag archives are slugified and inherit the post date"
  );
  assert.deepEqual(
    single.lastmodByPath.get("/categories/enseigner/"),
    isoDate("2026-11-15"),
    "category archives inherit the newest post date"
  );
  for (const path of ["/", "/articles/", "/categories/"]) {
    assert.deepEqual(
      single.lastmodByPath.get(path),
      isoDate("2026-11-15"),
      `${path} uses the newest post date`
    );
  }

  const stale = buildSitemapMetadata(
    [
      {
        slug: "stale",
        date: new Date("2026-11-10T00:00:00Z"),
        lastmod: new Date("2026-11-01T00:00:00Z")
      }
    ],
    { pageSize: 6 }
  );

  assert.deepEqual(
    stale.lastmodByPath.get("/articles/stale/"),
    isoDate("2026-11-10"),
    "a lastmod older than date is ignored"
  );

  const many = buildSitemapMetadata(
    [
      { slug: "new", tags: ["fle"], date: new Date("2026-11-10T00:00:00Z") },
      { slug: "old", tags: ["fle", "cecrl"], date: new Date("2026-10-01T00:00:00Z") }
    ],
    { pageSize: 1 }
  );

  assert.deepEqual(many.lastmodByPath.get("/articles/new/"), isoDate("2026-11-10"));
  assert.deepEqual(many.lastmodByPath.get("/articles/old/"), isoDate("2026-10-01"));
  assert.deepEqual(
    many.lastmodByPath.get("/etiquettes/fle/"),
    isoDate("2026-11-10"),
    "shared tags keep the newest post date"
  );
  assert.deepEqual(
    many.lastmodByPath.get("/articles/2/"),
    isoDate("2026-11-10"),
    "paginated archive pages inherit the newest post date"
  );

  const undated = buildSitemapMetadata([{ slug: "draft" }], { pageSize: 6 });

  assert.deepEqual(undated.lastmodByPath.size, 0, "no date means no lastmod");
  assert.ok(
    undated.emptyCategoryPaths.has("/categories/enseigner/"),
    "posts without a category do not populate categories"
  );
});
