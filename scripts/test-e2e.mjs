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

const homeHtml = readFile("dist/index.html");
const aboutHtml = readFile("dist/about/index.html");
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

  assertIncludes(postHtml, "min read", "reading time");
  assertIncludes(postHtml, "All Posts", "post footer all posts link");
  assertIncludes(postHtml, "Share this post on", "share block");
  assertIncludes(postHtml, `/raw/posts/${representativeSlug}.md`, "raw reuse link");
  assertFile(`dist/raw/posts/${representativeSlug}.md`);
  assert.ok(!rawMarkdown.startsWith("---"), "Raw reuse file should not include frontmatter");
  assert.ok(!rawMarkdown.includes("\ntitle:"), "Raw reuse file should not include frontmatter fields");
  assert.ok(rawMarkdown.startsWith(`# ${representativeTitle}`), "Raw reuse file should start with the markdown H1 title");
  assertIncludes(postHtml, `>${representativeTitle}</h1>`, "post HTML should render the markdown H1 title");
} else {
  assertIncludes(homeHtml, "No posts published yet.", "home empty state");
  const archiveHtml = readFile("dist/posts/index.html");
  assertIncludes(archiveHtml, "No posts published yet.", "archive empty state");
}

assertIncludes(aboutHtml, "GitHub activity", "about GitHub activity section");

console.log("test:e2e passed");
