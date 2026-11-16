import assert from "node:assert/strict";
import { buildEmptyCategoryPaths } from "../../src/lib/sitemap.ts";
import { POST_CATEGORIES } from "../../src/lib/content/taxonomy.ts";

/** Paths are compared as sorted arrays: the set order is not a contract. */
function sortedPaths(posts: Array<{ category?: string }>) {
  return [...buildEmptyCategoryPaths(posts)].sort();
}

function categoryPath(category: string) {
  return `/categories/${category}/`;
}

export function testSitemap(): void {
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
}
