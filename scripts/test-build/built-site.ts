import { PUBLISHED_POSTS, type ExpectedPost } from "../build-expectations.ts";
import { parsePage, type PageDocument } from "../page-dom.ts";
import {
  assertFile,
  executableInlineScriptHashes,
  readFile,
  readJson
} from "../test-helpers.ts";

export type SearchIndexItem = {
  title?: string;
  description?: string;
  tags?: string[];
  url?: string;
  date?: string;
  dateLabel?: string;
  updated?: string;
  updatedLabel?: string;
  excerpt?: string;
  content?: string;
};

export type BuiltPost = {
  post: ExpectedPost;
  raw: string;
  dom: PageDocument;
};

/** Artifacts read once from `dist/` and shared by the build checks. */
export type BuiltSite = {
  homeHtml: string;
  aboutHtml: string;
  redirects: string;
  headers: string;
  robots: string;
  license: string;
  rssXml: string;
  searchIndex: SearchIndexItem[];
  home: PageDocument;
  about: PageDocument;
  posts: BuiltPost[];
  inlineScriptHashes: string[];
  cspLine: string | undefined;
};

export function loadBuiltSite(): BuiltSite {
  const requiredFiles = [
    "dist/index.html",
    "dist/index.json",
    "dist/rss.xml",
    "dist/sitemap-index.xml",
    "dist/robots.txt",
    "dist/_redirects",
    "dist/_headers",
    "dist/LICENSE.txt",
    "dist/LICENSES/BSD-3-Clause.txt",
    "dist/LICENSES/CC-BY-4.0.txt",
    "dist/a-propos/index.html",
    "dist/confidentialite/index.html",
    ...PUBLISHED_POSTS.flatMap((post) => [
      `dist/articles/${post.slug}/index.html`,
      `dist${post.rawPath}`,
      `dist${post.socialImagePath}`
    ])
  ];

  for (const file of requiredFiles) {
    assertFile(file);
  }

  const homeHtml = readFile("dist/index.html");
  const aboutHtml = readFile("dist/a-propos/index.html");
  const headers = readFile("dist/_headers");
  const searchIndex = readJson<SearchIndexItem[]>("dist/index.json");
  const inlineScriptHashes = executableInlineScriptHashes("dist/index.html");
  const cspLine = headers
    .split("\n")
    .find((line) => line.trimStart().startsWith("Content-Security-Policy:"));

  return {
    homeHtml,
    aboutHtml,
    redirects: readFile("dist/_redirects"),
    headers,
    robots: readFile("dist/robots.txt"),
    license: readFile("dist/LICENSE.txt"),
    rssXml: readFile("dist/rss.xml"),
    searchIndex,
    home: parsePage(homeHtml),
    about: parsePage(aboutHtml),
    posts: PUBLISHED_POSTS.map((post) => ({
      post,
      raw: readFile(`dist${post.rawPath}`),
      dom: parsePage(readFile(`dist/articles/${post.slug}/index.html`))
    })),
    inlineScriptHashes,
    cspLine
  };
}
