import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  absoluteUrl,
  EMPTY_CATEGORY_PATHS,
  expectedSitemapPaths,
  PUBLISHED_CATEGORIES,
  PUBLISHED_POSTS
} from "../build-expectations.ts";
import { assertFile, htmlFiles, htmlPathToUrlPath, readFile } from "../test-helpers.ts";

/** Sitemap dates, category archives, and the built-page parity. */
export function checkSitemapEntries(): void {
  const sitemapXml = readFile("dist/sitemap-0.xml");
  const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    (match) => match[1]
  );
  const sitemapLastmods = new Map(
    sitemapEntries.map((entry) => {
      const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
      const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
      return [loc, lastmod];
    })
  );

  for (const post of PUBLISHED_POSTS) {
    assert.equal(
      sitemapLastmods.get(absoluteUrl(post.url)),
      post.lastmod.toISOString(),
      `${post.slug} sitemap lastmod`
    );
  }

  for (const category of PUBLISHED_CATEGORIES) {
    assertFile(`dist/categories/${category}/index.html`);
  }

  for (const emptyCategoryPath of EMPTY_CATEGORY_PATHS) {
    assert.ok(
      !sitemapLastmods.has(absoluteUrl(emptyCategoryPath)),
      `sitemap must not advertise the empty category ${emptyCategoryPath}`
    );
  }
  for (const category of PUBLISHED_CATEGORIES) {
    assert.ok(
      sitemapLastmods.has(absoluteUrl(`/categories/${category}/`)),
      `sitemap must advertise the populated category ${category}`
    );
  }

  for (const emptyCategoryPath of EMPTY_CATEGORY_PATHS) {
    const slug = path.basename(emptyCategoryPath);
    assert.ok(
      !fs.existsSync(path.join(process.cwd(), `dist/categories/${slug}/index.html`)),
      `empty category ${slug} must not be generated`
    );
    assert.ok(
      !readFile("dist/categories/index.html").includes(emptyCategoryPath),
      `the category index must not link the empty category ${slug}`
    );
  }

  // Every built page must be advertised exactly once, and every advertised URL
  // must exist. The sitemap and the file tree are two views of the same site.
  const builtPagePaths = new Set(
    htmlFiles()
      .filter((file) => path.basename(file) !== "404.html")
      .map(htmlPathToUrlPath)
  );
  const sitemapPaths = new Set(
    [...sitemapLastmods.keys()].map((loc) => new URL(loc).pathname)
  );
  assert.deepEqual(
    [...sitemapPaths].sort(),
    [...builtPagePaths].sort(),
    "the sitemap lists every indexable page and nothing else"
  );
  assert.deepEqual(
    [...sitemapPaths].sort(),
    [...expectedSitemapPaths()].sort(),
    "the sitemap matches the derived expectations"
  );
}
