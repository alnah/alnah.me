import assert from "node:assert/strict";
import { canonicalPostPath, normalizeAlias } from "../src/lib/aliases.js";
import {
  extractLeadingMarkdownTitle,
  resolveMarkdownTitle,
  stripLeadingMarkdownTitle,
  validateMarkdownTitle
} from "../src/lib/document-title.js";
import { stripFrontmatter } from "../src/lib/post-files.js";
import { serializeJsonForHtmlScript } from "../src/lib/script-safe.js";

const sampleMarkdown = `---
title: "Compounding Through Clarity"
date: 2026-03-10
---

# Compounding Through Clarity

First paragraph.

## Why do this now?

Because readable systems compound.`;
const strippedSampleMarkdown = stripFrontmatter(sampleMarkdown);

assert.equal(normalizeAlias("reuse-notes"), "/reuse-notes/");
assert.equal(normalizeAlias('/articles/old-slug'), '/articles/old-slug/');
assert.equal(canonicalPostPath('search-that-stays-local'), '/articles/search-that-stays-local/');
assert.throws(() => normalizeAlias("../bad"), /Invalid alias path/);
assert.throws(() => normalizeAlias("/bad path"), /Invalid alias path/);

assert.equal(extractLeadingMarkdownTitle(strippedSampleMarkdown), "Compounding Through Clarity");
assert.equal(
  resolveMarkdownTitle(strippedSampleMarkdown, "Compounding Through Clarity"),
  "Compounding Through Clarity"
);
assert.throws(
  () => validateMarkdownTitle("# Wrong Title", "Expected Title"),
  /frontmatter title "Expected Title" but leading H1 "Wrong Title"/
);
assert.throws(
  () => validateMarkdownTitle("No heading here", "Expected Title", { requireLeadingTitle: true }),
  /missing a leading H1 matching "Expected Title"/
);
assert.equal(
  stripLeadingMarkdownTitle(strippedSampleMarkdown),
  `First paragraph.\n\n## Why do this now?\n\nBecause readable systems compound.`
);

assert.equal(
  stripFrontmatter(sampleMarkdown),
  `# Compounding Through Clarity\n\nFirst paragraph.\n\n## Why do this now?\n\nBecause readable systems compound.`
);

const serialized = serializeJsonForHtmlScript({
  title: '</script><script>alert("xss")</script>',
  ampersand: "R&D"
});
assert.ok(!serialized.includes("</script>"), "serializer should not emit a closing script tag");
assert.ok(serialized.includes("\\u003C/script\\u003E"), "serializer should escape script endings");
assert.ok(serialized.includes("R\\u0026D"), "serializer should escape ampersands");

console.log("test:unit passed");
