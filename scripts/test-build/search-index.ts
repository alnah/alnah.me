import assert from "node:assert/strict";
import { SITE } from "../../src/config/site.ts";
import { absoluteUrl, PUBLISHED_POSTS } from "../build-expectations.ts";
import { assertIncludes } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Search documents and feed items match the published posts. */
export function checkSearchIndex({ searchIndex, rssXml }: BuiltSite): void {
  const rssLinks = [...rssXml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(
    searchIndex.map((item) => item.url).sort(),
    PUBLISHED_POSTS.map((post) => post.url).sort(),
    "search documents match the published posts"
  );
  assert.deepEqual(
    rssLinks,
    PUBLISHED_POSTS.map((post) => absoluteUrl(post.url)).sort(),
    "feed items match the published posts"
  );
  assert.ok(Array.isArray(searchIndex), "Search index should be an array");
  assertIncludes(rssXml, 'xmlns:atom="http://www.w3.org/2005/Atom"', "RSS atom namespace");
  assertIncludes(rssXml, "<language>fr</language>", "RSS language");
  assertIncludes(rssXml, 'rel="self"', "RSS self link");
  assert.ok(
    /<generator>Astro v\d+\.\d+\.\d+ with @astrojs\/rss<\/generator>/.test(rssXml),
    "RSS generator should reflect the installed Astro version"
  );
  const newestPostDate = new Date(
    Math.max(...PUBLISHED_POSTS.map((post) => post.lastmod.getTime()))
  );
  assertIncludes(
    rssXml,
    `<lastBuildDate>${newestPostDate.toUTCString()}</lastBuildDate>`,
    "RSS lastBuildDate uses the latest content date"
  );
  assertIncludes(rssXml, "<category>", "RSS item categories");
  assertIncludes(rssXml, `<author>${SITE.author.email}</author>`, "RSS item author");

  for (const item of searchIndex) {
    assert.ok(item.title, "search item missing title");
    assert.ok(item.description, "search item missing description");
    assert.ok(Array.isArray(item.tags), "search item missing tags array");
    assert.ok(item.url?.startsWith("/articles/"), "search item URL should point to a post");
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date ?? ""), "search item missing ISO date");
    assert.ok(item.dateLabel, "search item missing human date label");
    if (item.updated) {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.updated), "search item updated date should be ISO");
      assert.ok(item.updatedLabel, "search item missing updated label");
    }
    assert.ok(item.excerpt, "search item missing excerpt");
    assert.ok(item.content, "search item missing searchable content");
  }
}
