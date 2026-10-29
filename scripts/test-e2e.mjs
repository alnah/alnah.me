import assert from "node:assert/strict";
import path from "node:path";
import matter from "gray-matter";
import { stripFrontmatter } from "../src/lib/post-files.js";
import { resolveMarkdownTitle } from "../src/lib/document-title.js";
import {
  assertFile,
  assertIncludes,
  readAbsoluteFile,
  readFile,
  representativePostPath
} from "./checks.mjs";

/**
 * The Markdown renderer applies typographic punctuation (curly quotes, narrow
 * spaces), so comparing rendered text to raw Markdown needs normalization.
 */
function normalizeRenderedText(value) {
  return value
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const homeHtml = readFile("dist/index.html");
const aboutHtml = readFile("dist/a-propos/index.html");
const representativePath = representativePostPath();

assertIncludes(homeHtml, "data-search-trigger", "search trigger");
assertIncludes(homeHtml, "data-search-root", "search root");
assertIncludes(homeHtml, "data-theme-toggle", "theme toggle");

if (representativePath) {
  const representativeSlug = path.basename(path.dirname(representativePath));
  const postHtml = readAbsoluteFile(representativePath);
  const rawMarkdown = readFile(`dist/raw/posts/${representativeSlug}.md`);
  const representativeSourceMarkdown = readFile(`src/content/posts/${representativeSlug}/index.md`);
  const representativeTitle = resolveMarkdownTitle(
    stripFrontmatter(representativeSourceMarkdown),
    matter(representativeSourceMarkdown).data.title
  );

  assertIncludes(postHtml, "min de lecture", "reading time");
  assertIncludes(postHtml, "Tous les articles", "post footer all posts link");
  assertIncludes(postHtml, "Partager cet article sur", "share block");
  assertIncludes(postHtml, `/raw/posts/${representativeSlug}.md`, "raw reuse link");
  assertFile(`dist/raw/posts/${representativeSlug}.md`);
  assert.ok(!rawMarkdown.startsWith("---"), "Raw reuse file should not include frontmatter");
  assert.ok(!rawMarkdown.includes("\ntitle:"), "Raw reuse file should not include frontmatter fields");
  assert.ok(rawMarkdown.startsWith(`# ${representativeTitle}`), "Raw reuse file should start with the markdown H1 title");
  assert.ok(
    normalizeRenderedText(postHtml).includes(
      normalizeRenderedText(`>${representativeTitle}</h1>`)
    ),
    "post HTML should render the markdown H1 title"
  );
} else {
  assertIncludes(homeHtml, 'Aucun article publié pour le moment.', 'home empty state');
  const archiveHtml = readFile('dist/articles/index.html');
  assertIncludes(archiveHtml, 'Aucun article publié pour le moment.', 'archive empty state');
}

assertIncludes(aboutHtml, "Activité GitHub", "about GitHub activity section");

console.log("test:e2e passed");
