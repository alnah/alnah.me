import assert from "node:assert/strict";
import {
  buildSearchFieldIndex,
  searchDocuments,
  type SearchField,
  type SearchFieldIndex,
  type SearchIndexDocument
} from "../../src/lib/search-ranking.ts";
import { buildSearchIndex } from "../../src/lib/search.ts";

const EMPTY_SEARCH_FIELDS: Record<SearchField, string> = {
  title: "",
  category: "",
  tags: "",
  date: "",
  description: "",
  excerpt: "",
  content: ""
};

function indexDocument(
  fields: Partial<Record<SearchField, string>>,
  position = 0
): SearchIndexDocument {
  const merged: Record<SearchField, string> = { ...EMPTY_SEARCH_FIELDS, ...fields };
  const search = Object.fromEntries(
    Object.entries(merged).map(([name, value]) => [name, buildSearchFieldIndex(value)])
  ) as Record<SearchField, SearchFieldIndex>;

  return {
    title: merged.title,
    description: merged.description,
    category: merged.category,
    tags: [],
    url: "/articles/example/",
    date: "",
    dateLabel: "",
    excerpt: merged.excerpt,
    content: merged.content,
    position,
    search
  };
}

/** Search tokenization and ranking. */
export function testSearch(): void {
  assert.deepEqual(
    searchDocuments([indexDocument({ title: "recherche" })], "   "),
    [],
    "a blank query returns nothing"
  );
  assert.deepEqual(
    searchDocuments([indexDocument({ content: "sans rapport" })], "recherche"),
    [],
    "a document without a matching token is dropped"
  );

  const ranked = searchDocuments(
    [
      indexDocument({ content: "recherche locale" }, 1),
      indexDocument({ title: "recherche locale" }, 0)
    ],
    "recherche"
  );
  assert.equal(ranked.length, 2, "both documents match");
  assert.equal(ranked[0].position, 0, "a title match ranks above a content match");

  const exactVsPrefix = searchDocuments(
    [
      indexDocument({ title: "recherches" }, 1),
      indexDocument({ title: "recherche" }, 0)
    ],
    "recherche"
  );
  assert.equal(exactVsPrefix[0].position, 0, "an exact title beats a prefix title");

  const manyMatches = Array.from({ length: 12 }, (_, index) =>
    indexDocument({ title: `recherche ${index}` }, index)
  );
  assert.equal(searchDocuments(manyMatches, "recherche").length, 8, "results are limited to 8");

  const [updatedIndex] = buildSearchIndex([
    {
      title: "mise à jour",
      description: "mise à jour",
      category: "Enseigner",
      tags: [],
      url: "/articles/updated/",
      date: "2026-11-06",
      dateLabel: "6 nov. 2026",
      updated: "2026-11-15",
      updatedLabel: "Mis à jour le 15 nov. 2026",
      excerpt: "",
      content: ""
    }
  ]);

  assert.equal(
    searchDocuments([updatedIndex], "15 nov 2026").length,
    1,
    "an updated date is searchable"
  );
}
