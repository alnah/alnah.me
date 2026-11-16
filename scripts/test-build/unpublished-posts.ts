import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { absoluteUrl, UNPUBLISHED_POST_SLUGS } from "../build-expectations.ts";
import { readFile } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Drafts must leave no trace in the build. */
export function checkUnpublishedPosts({ rssXml, searchIndex }: BuiltSite): void {
  const sitemapXml = readFile("dist/sitemap-0.xml");
  const sitemapPaths = new Set(
    [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname)
  );
  const rssLinks = [...rssXml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map(
    (match) => match[1]
  );

  // Drafts must leave no trace in the build.
  for (const slug of UNPUBLISHED_POST_SLUGS) {
    assert.ok(
      !fs.existsSync(path.join(process.cwd(), `dist/articles/${slug}/index.html`)),
      `draft ${slug} must not produce a page`
    );
    assert.ok(
      !fs.existsSync(path.join(process.cwd(), `dist/raw/posts/${slug}.md`)),
      `draft ${slug} must not produce a raw export`
    );
    assert.ok(
      !fs.existsSync(path.join(process.cwd(), `dist/og/articles/${slug}.png`)),
      `draft ${slug} must not produce a social image`
    );
    assert.ok(
      !sitemapPaths.has(`/articles/${slug}/`),
      `draft ${slug} must not be in the sitemap`
    );
    assert.ok(
      !searchIndex.some((item) => item.url === `/articles/${slug}/`),
      `draft ${slug} must not be searchable`
    );
    assert.ok(
      !rssLinks.includes(absoluteUrl(`/articles/${slug}/`)),
      `draft ${slug} must not be in the feed`
    );
  }
}
