import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { SearchIndexDocument } from "../../src/lib/search-ranking.ts";
import { readJson } from "../test-helpers.ts";

export function loadSearchIndex(): SearchIndexDocument[] {
  return readJson<SearchIndexDocument[]>("dist/index.json");
}

/** First published post, used as the representative document. */
export function targetPost(): SearchIndexDocument | undefined {
  return loadSearchIndex().find((item) => item?.title && item?.url);
}

export function firstUsefulToken(title: string) {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .find((token) => token.length >= 4) || title
  );
}

export async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const previousScrollX = window.scrollX;

    window.scrollTo(999999, window.scrollY);
    const maxScrollX = window.scrollX;
    window.scrollTo(previousScrollX, window.scrollY);

    return maxScrollX;
  });

  assert.equal(overflow, 0, `${label} should not overflow horizontally (got ${overflow}px)`);
}
