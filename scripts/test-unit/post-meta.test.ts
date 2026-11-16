import assert from "node:assert/strict";
import test from "node:test";
import { derivePostMeta } from "../../src/lib/content/post-meta.ts";

/** Post display metadata: title lockstep, date policy, reading time. */
test("post meta: one derivation for every surface", () => {
  const entry = {
    body: `# Titre\n\n${"mot ".repeat(220)}`,
    data: {
      title: "Titre",
      date: new Date("2026-01-01T00:00:00Z"),
      lastmod: new Date("2026-02-01T00:00:00Z")
    }
  };

  const meta = derivePostMeta(entry);

  assert.equal(meta.title, "Titre");
  assert.equal(meta.publicationIso, "2026-01-01");
  assert.equal(meta.displayIso, "2026-02-01");
  assert.equal(meta.postDate.isUpdated, true);
  assert.equal(meta.postDate.label, "Mis à jour le 1 févr. 2026");
  // The leading H1 is rendered once by the layout, never counted as prose.
  assert.equal(meta.readingMinutes, 1);
});

test("post meta: publishDate wins and equal lastmod is not an update", () => {
  const publicationDate = new Date("2026-03-01T00:00:00Z");
  const entry = {
    body: "# Titre\n\nTexte.",
    data: {
      title: "Titre",
      date: new Date("2026-01-01T00:00:00Z"),
      publishDate: publicationDate,
      lastmod: new Date(publicationDate)
    }
  };

  const meta = derivePostMeta(entry);

  assert.equal(meta.publicationDate, publicationDate);
  assert.equal(meta.publicationIso, "2026-03-01");
  assert.equal(meta.displayIso, "2026-03-01");
  assert.equal(meta.postDate.isUpdated, false);
  assert.equal(meta.postDate.label, "1 mars 2026");
  assert.equal(meta.readingMinutes, 1);
});
