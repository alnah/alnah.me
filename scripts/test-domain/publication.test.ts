import assert from "node:assert/strict";
import test from "node:test";
import {
  isAfter,
  isBefore,
  isPublishedData,
  latestOf,
  resolvePublicationDate
} from "../../src/lib/publication.ts";

/** Publication windows: draft, publishDate, and expiryDate. */
test('publication: windows and dates', () => {
  const now = new Date("2026-06-15T00:00:00Z");
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2026-12-01T00:00:00Z");

  assert.equal(isBefore(undefined, now), true, "missing date is before now");
  assert.equal(isAfter(undefined, now), true, "missing date is after now");
  assert.equal(isBefore(past, now), true, "past is before now");
  assert.equal(isBefore(future, now), false, "future is not before now");
  assert.equal(isAfter(future, now), true, "future is after now");
  assert.equal(isAfter(past, now), false, "past is not after now");

  assert.equal(
    resolvePublicationDate({ publishDate: future, date: past }).getTime(),
    future.getTime(),
    "publishDate wins over date"
  );
  assert.equal(
    resolvePublicationDate({ date: past }).getTime(),
    past.getTime(),
    "date is the fallback publication date"
  );

  assert.equal(isPublishedData({ draft: false, date: past }, now), true, "published past post");
  assert.equal(isPublishedData({ draft: true, date: past }, now), false, "draft is not published");
  assert.equal(
    isPublishedData({ draft: false, date: past, publishDate: future }, now),
    false,
    "future publishDate is not published"
  );
  assert.equal(
    isPublishedData({ draft: false, date: past, expiryDate: past }, now),
    false,
    "past expiryDate is not published"
  );
  assert.equal(
    isPublishedData({ draft: false, date: past, publishDate: past, expiryDate: future }, now),
    true,
    "post inside the publication window is published"
  );
});

test('publication: latest known date wins', () => {
  const earlier = new Date("2026-01-01T00:00:00Z");
  const later = new Date("2026-06-01T00:00:00Z");

  assert.equal(latestOf([earlier, later]), later);
  assert.equal(latestOf([later, earlier]), later);
  assert.equal(latestOf([earlier, undefined]), earlier);
  // Ties keep the first known date: lastmod equal to date is not an update.
  assert.equal(latestOf([earlier, new Date(earlier)]), earlier);
  assert.equal(latestOf([undefined, new Date("nonsense")]), undefined);
});
