import assert from "node:assert/strict";
import { formatDate, resolvePostDate } from "../../src/lib/content/format.ts";

export function testPostDate() {
  const published = new Date("2026-11-06T00:00:00Z");
  const updated = new Date("2026-11-15T00:00:00Z");
  const earlier = new Date("2026-11-01T00:00:00Z");

  const publication = resolvePostDate(published);
  assert.equal(publication.date.getTime(), published.getTime());
  assert.equal(publication.label, formatDate(published));
  assert.equal(publication.isUpdated, false);

  const update = resolvePostDate(published, updated);
  assert.equal(update.date.getTime(), updated.getTime());
  assert.equal(update.label, `Mis à jour le ${formatDate(updated)}`);
  assert.equal(update.isUpdated, true);

  assert.equal(resolvePostDate(published, published).isUpdated, false);
  assert.equal(resolvePostDate(published, earlier).isUpdated, false);
  assert.equal(resolvePostDate(published, earlier).label, formatDate(published));
}
