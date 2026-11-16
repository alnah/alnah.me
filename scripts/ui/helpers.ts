import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { SearchIndexDocument } from "../../src/lib/search-ranking.ts";
import { postPath } from "../../src/lib/site-paths.ts";
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

/** Posts that exist in the build, as public paths. */
export function builtPostPaths(): string[] {
  const articlesDir = path.join(process.cwd(), "dist", "articles");
  return fs
    .readdirSync(articlesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => postPath(entry.name))
    .filter((url) => fs.existsSync(path.join(process.cwd(), "dist", url, "index.html")));
}

/** First built post whose HTML satisfies the predicate, or null. */
export function findPostPath(predicate: (html: string) => boolean): string | null {
  for (const url of builtPostPaths()) {
    const html = fs.readFileSync(path.join(process.cwd(), "dist", url, "index.html"), "utf8");

    if (predicate(html)) {
      return url;
    }
  }

  return null;
}

export async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const previousScrollX = window.scrollX;

    window.scrollTo(999999, window.scrollY);
    const maxScrollX = window.scrollX;
    window.scrollTo(previousScrollX, window.scrollY);

    return maxScrollX;
  });

  expect(overflow, `${label} should not overflow horizontally`).toBe(0);
}
