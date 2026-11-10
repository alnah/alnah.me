import assert from "node:assert/strict";
import { slugify } from "../../src/lib/content/format.ts";
import {
  getPostCategoryMeta,
  POST_CATEGORIES,
  POST_CATEGORY_META,
  summarizeTags
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

  assert.equal(slugify("pédagogie"), "pedagogie");
  assert.equal(slugify("Pédagogie"), "pedagogie");
  assert.equal(slugify("scénario"), "scenario");
  assert.equal(slugify("cœur"), "coeur");

  assert.deepEqual(
    summarizeTags([["pédagogie"], ["pedagogie"], ["Pédagogie"]]),
    [{ label: "pédagogie", count: 3, slug: "pedagogie" }],
    "spelling variants share one tag archive"
  );
  assert.deepEqual(
    summarizeTags([["pedagogie", "pédagogie"], ["pédagogie"]]),
    [{ label: "pédagogie", count: 2, slug: "pedagogie" }],
    "a post counts once per tag slug"
  );
  assert.deepEqual(
    summarizeTags([["zèbre", "abc"]]).map((tag) => tag.slug),
    ["abc", "zebre"],
    "tags are sorted by label"
  );
}
