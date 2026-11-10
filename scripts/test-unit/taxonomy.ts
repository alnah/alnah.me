import assert from "node:assert/strict";
import { slugify } from "../../src/lib/content/format.ts";
import {
  getPostCategoryMeta,
  POST_CATEGORIES,
  POST_CATEGORY_META
} from "../../src/lib/content/taxonomy.ts";

/** The category key is the URL slug, so it must match the displayed name. */
export function testTaxonomy(): void {
  for (const category of POST_CATEGORIES) {
    const { label } = POST_CATEGORY_META[category];

    assert.equal(
      category,
      slugify(label),
      `category slug "${category}" must match its name "${label}"`
    );
    assert.equal(getPostCategoryMeta(category).slug, category, "the category key is the slug");
  }
}
