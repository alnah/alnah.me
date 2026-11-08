import assert from "node:assert/strict";
import { canonicalPostPath, normalizeAlias } from "../src/lib/aliases.ts";
import {
  extractLeadingMarkdownTitle,
  stripLeadingMarkdownTitle,
  validateMarkdownTitle
} from "../src/lib/document-title.ts";
import { stripFrontmatter } from "../src/lib/post-files.ts";
import {
  findMermaidFences,
  mermaidAccessibilityErrors
} from "../src/lib/content/mermaid.ts";
import { serializeJsonForHtmlScript } from "../src/lib/script-safe.ts";

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
  validateMarkdownTitle(strippedSampleMarkdown, "Compounding Through Clarity"),
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

const validMermaidFence = [
  "```mermaid",
  "flowchart TD",
  "  accTitle: Flux d'authentification",
  "  accDescr: Décrit le parcours de connexion.",
  "  A --> B",
  "```"
].join("\n");
const blockDescrFence = [
  "```mermaid",
  "sequenceDiagram",
  "  accTitle: Échange",
  "  accDescr {",
  "    Premier échange.",
  "    Second échange.",
  "  }",
  "  A->>B: Salut",
  "```"
].join("\n");
const undocumentedFence = ["```mermaid", "flowchart TD", "  A --> B", "```"].join("\n");
const missingDescrFence = [
  "```mermaid",
  "flowchart TD",
  "  accTitle: Titre",
  "  A --> B",
  "```"
].join("\n");
const nestedMermaidExample = [
  "````markdown",
  "```mermaid",
  "flowchart TD",
  "  A --> B",
  "```",
  "````"
].join("\n");

assert.deepEqual(findMermaidFences("No fence here."), []);
assert.equal(findMermaidFences(`Intro.\n\n${validMermaidFence}`).length, 1);
assert.equal(findMermaidFences(`Intro.\n\n${validMermaidFence}`)[0].line, 3);
assert.ok(findMermaidFences(validMermaidFence)[0].source.includes("flowchart TD"));
assert.deepEqual(
  findMermaidFences(nestedMermaidExample),
  [],
  "a mermaid example nested in a code block is not a diagram"
);
assert.deepEqual(mermaidAccessibilityErrors(validMermaidFence), []);
assert.deepEqual(mermaidAccessibilityErrors(blockDescrFence), []);
assert.equal(mermaidAccessibilityErrors(undocumentedFence).length, 2);
assert.match(mermaidAccessibilityErrors(missingDescrFence)[0], /missing accDescr/);
assert.equal(mermaidAccessibilityErrors(missingDescrFence).length, 1);

console.log("test:unit passed");
