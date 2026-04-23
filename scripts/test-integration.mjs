import assert from "node:assert/strict";
import { normalizeAlias } from "../src/lib/aliases.js";
import { serializeJsonForHtmlScript } from "../src/lib/script-safe.js";
import {
  assertIncludes,
  assertInternalLinks,
  readAbsoluteFile,
  readFile,
  readJson,
  representativePostPath
} from "./checks.mjs";

const rssXml = readFile("dist/rss.xml");
const searchIndex = readJson("dist/index.json");
const aboutHtml = readFile("dist/a-propos/index.html");
const representativePath = representativePostPath();

assertInternalLinks();

assert.ok(
  serializeJsonForHtmlScript({ title: '</script><script>alert(1)</script>' }).includes("\\u003C/script\\u003E"),
  "JSON-LD serializer should escape script-closing sequences"
);
assert.ok(
  !serializeJsonForHtmlScript({ title: '</script><script>alert(1)</script>' }).includes("</script>"),
  "JSON-LD serializer should never emit a raw closing script tag"
);

if (representativePath) {
  const postHtml = readAbsoluteFile(representativePath);

  assertIncludes(postHtml, '<link rel="canonical" href="https://alnah.me/articles/', "canonical link");
  assertIncludes(postHtml, '<meta property="og:type" content="article">', "og:type");
  assertIncludes(postHtml, '<meta name="twitter:card" content="summary', "twitter card");
  assertIncludes(postHtml, '"@type":"BlogPosting"', "BlogPosting schema");

  for (const platform of [
    "twitter.com/intent/tweet",
    "linkedin.com/sharing/share-offsite",
    "wa.me/?text=",
    "facebook.com/sharer/sharer.php",
    "t.me/share/url",
    "mailto:"
  ]) {
    assertIncludes(postHtml, platform, `share link ${platform}`);
  }
}

assertIncludes(aboutHtml, '"sameAs":["https://github.com/alnah","https://x.com/_alnah","https://www.youtube.com/@alnah_chan","https://www.tiktok.com/@_alnah"', "ProfilePage sameAs should include YouTube before TikTok");

assertIncludes(rssXml, 'xmlns:atom="http://www.w3.org/2005/Atom"', "RSS atom namespace");
assertIncludes(rssXml, "<language>fr</language>", "RSS language");
assertIncludes(rssXml, 'rel="self"', "RSS self link");
assertIncludes(rssXml, "<generator>Astro v6 with @astrojs/rss</generator>", "RSS generator");

if (searchIndex.length > 0) {
  assertIncludes(rssXml, "<link>https://alnah.me/articles/", "RSS canonical links");
  assertIncludes(rssXml, "<category>", "RSS item categories");
  assertIncludes(rssXml, `<author>${"contact@alnah.me"}</author>`, "RSS item author");
}

assert.equal(normalizeAlias("reuse-notes"), "/reuse-notes/", "Alias normalization should add slashes");
assert.throws(() => normalizeAlias("../bad"), /Invalid alias path/, "Alias normalization should reject parent traversal");
assert.throws(() => normalizeAlias("/bad path"), /Invalid alias path/, "Alias normalization should reject spaces");

for (const item of searchIndex) {
  assert.ok(item.title, "Search item missing title");
  assert.ok(item.description, "Search item missing description");
  assert.ok(Array.isArray(item.tags), "Search item missing tags array");
  assert.ok(item.url?.startsWith('/articles/'), 'Search item URL should point to a post');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date), "Search item missing ISO date");
  assert.ok(item.dateLabel, "Search item missing human date label");
  assert.ok(item.excerpt, "Search item missing excerpt");
  assert.ok(item.content, "Search item missing searchable content");
}

console.log("test:integration passed");
