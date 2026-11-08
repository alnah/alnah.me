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
import { describeDiagramRole } from "../src/components/mermaid/labels.ts";
import { buildThemeVariables } from "../src/components/mermaid/theme.ts";
import { buildCopyText, diagramFileName } from "../src/components/mermaid/export-svg.ts";
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

const tokenValues: Record<string, string> = {
  "--color-bg": "#ffffff",
  "--color-surface": "#f8f9fa",
  "--color-surface-strong": "#e9ecef",
  "--color-text": "#212529",
  "--color-text-muted": "#6c757d",
  "--color-border": "#dee2e6"
};
const themeVariables = buildThemeVariables((token) => tokenValues[token] ?? "");

assert.equal(themeVariables.mainBkg, "#e9ecef");
assert.equal(themeVariables.lineColor, "#6c757d");
assert.equal(themeVariables.clusterBorder, "#dee2e6");
assert.ok(
  !Object.values(themeVariables).some((value) => value.includes("color-mix")),
  "mermaid variables must be solid colors"
);
assert.equal(describeDiagramRole("flowchart-v2"), "diagramme de flux");
assert.equal(describeDiagramRole("sequenceDiagram"), "diagramme de séquence");
assert.equal(describeDiagramRole("unknown-key"), "diagramme");

assert.equal(diagramFileName("Parcours de connexion"), "parcours-de-connexion.svg");
assert.equal(diagramFileName("Échange client/serveur"), "echange-client-serveur.svg");
assert.equal(diagramFileName("***"), "diagramme.svg");

const copyText = buildCopyText("flowchart TD\n  A --> B", {
  title: "Parcours",
  author: "Alexis Nahan (alnah)",
  siteName: "alnah.me",
  siteUrl: "https://alnah.me",
  pageUrl: "https://alnah.me/articles/essai/",
  date: "2026-12-01",
  licenseName: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
});
assert.ok(copyText.includes("Alexis Nahan (alnah)"));
assert.ok(copyText.includes("https://alnah.me/articles/essai/ (2026-12-01)"));
assert.ok(copyText.includes("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)"));
assert.ok(copyText.includes("```mermaid"));

console.log("test:unit passed");
