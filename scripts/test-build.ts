import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SITE, SOCIAL_CONTACT_IDS } from "../src/config/site.ts";
import { formatDate, formatIsoDate } from "../src/lib/content/format.ts";
import {
  absoluteUrl,
  EMPTY_CATEGORY_PATHS,
  expectedSitemapPaths,
  PUBLISHED_CATEGORIES,
  PUBLISHED_POSTS,
  UNPUBLISHED_POST_SLUGS
} from "./build-expectations.ts";
import {
  assertFile,
  assertIncludes,
  assertInternalLinks,
  executableInlineScriptHashes,
  headerSection,
  htmlFiles,
  htmlPathToUrlPath,
  readFile,
  readJson,
  readJsonLd,
  readPngDimensions
} from "./test-helpers.ts";

/** Typographic punctuation and whitespace must not decide a text comparison. */
function normalizeText(value: string) {
  return value
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(html: string) {
  return normalizeText(html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " "));
}

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
const redirects = readFile("dist/_redirects");
const headers = readFile("dist/_headers");
const robots = readFile("dist/robots.txt");
const license = readFile("dist/LICENSE.txt");
const searchIndex = readJson<
  Array<{
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
  }>
>("dist/index.json");
const rssXml = readFile("dist/rss.xml");
const inlineScriptHashes = executableInlineScriptHashes("dist/index.html");
const cspLine = headers
  .split("\n")
  .find((line) => line.trimStart().startsWith("Content-Security-Policy:"));

const posts = PUBLISHED_POSTS.map((post) => ({
  post,
  html: readFile(`dist/articles/${post.slug}/index.html`),
  raw: readFile(`dist${post.rawPath}`)
}));

const websiteSchema = readJsonLd(homeHtml)[0] as {
  "@id"?: string;
  inLanguage?: string;
};
assert.equal(websiteSchema["@id"], absoluteUrl("/#website"), "website schema id");
assert.equal(websiteSchema.inLanguage, "fr-FR", "website schema language");

const profileSchema = readJsonLd(aboutHtml)[0] as {
  "@type"?: string;
  inLanguage?: string;
  mainEntity?: { "@id"?: string; sameAs?: string[] };
};
assert.equal(profileSchema["@type"], "ProfilePage", "profile page type");
assert.equal(profileSchema.inLanguage, "fr-FR", "profile page language");
assert.equal(
  profileSchema.mainEntity?.["@id"],
  absoluteUrl("/#person"),
  "profile person id"
);
assert.deepEqual(
  profileSchema.mainEntity?.sameAs,
  SOCIAL_CONTACT_IDS.map(
    (id) => SITE.contacts.find((contact) => contact.id === id)?.href
  ),
  "profile sameAs follows the configured social contacts"
);

for (const contact of SITE.contacts) {
  assertIncludes(homeHtml, `aria-label="${contact.label}"`, `home contact icon ${contact.label}`);
  assertIncludes(aboutHtml, `aria-label="${contact.label}"`, `about contact icon ${contact.label}`);
}
assertIncludes(homeHtml, "Me suivre sur", "home social label");
assertIncludes(homeHtml, "Me contacter par", "home contact label");
assertIncludes(aboutHtml, "Me suivre sur", "about social label");
assertIncludes(aboutHtml, "Me contacter par", "about contact label");
assertIncludes(homeHtml, `href="${absoluteUrl("/rss.xml")}"`, "home RSS href");

for (const { post, html, raw } of posts) {
  assertIncludes(html, `<link rel="canonical" href="${absoluteUrl(post.url)}">`, `${post.slug} canonical link`);
  assertIncludes(html, 'property="og:type" content="article"', `${post.slug} og:type`);
  assertIncludes(html, '<meta name="twitter:card" content="summary', `${post.slug} twitter card`);
  assertIncludes(html, '"@type":"BlogPosting"', `${post.slug} BlogPosting schema`);
  assertIncludes(html, "min de lecture", `${post.slug} reading time`);
  assertIncludes(html, "Tous les articles", `${post.slug} all posts link`);
  assertIncludes(html, "Partager cet article sur", `${post.slug} share block`);
  assertIncludes(html, post.rawPath, `${post.slug} raw reuse link`);

  for (const platform of [
    "twitter.com/intent/tweet",
    "linkedin.com/sharing/share-offsite",
    "wa.me/?text=",
    "facebook.com/sharer/sharer.php",
    "t.me/share/url",
    "mailto:"
  ]) {
    assertIncludes(html, platform, `${post.slug} share link ${platform}`);
  }

  const ogImage = absoluteUrl(post.socialImagePath);
  assertIncludes(html, `property="og:image" content="${ogImage}"`, `${post.slug} og:image`);
  assertIncludes(html, '"image":"' + ogImage + '"', `${post.slug} schema image`);
  assertIncludes(html, 'property="og:image:width" content="1200"', `${post.slug} og:image width`);
  assertIncludes(html, 'property="og:image:height" content="630"', `${post.slug} og:image height`);

  const dimensions = readPngDimensions(`dist${post.socialImagePath}`);
  assert.equal(dimensions.width, 1200, `${post.slug} og image width`);
  assert.equal(dimensions.height, 630, `${post.slug} og image height`);

  assert.ok(!raw.startsWith("---"), `${post.slug} raw export has no frontmatter`);
  assert.ok(!raw.includes("\ntitle:"), `${post.slug} raw export has no frontmatter fields`);
  assert.ok(raw.startsWith(`# ${post.title}`), `${post.slug} raw export starts with its title`);
  assertIncludes(raw, `© ${new Date().getFullYear()} [${SITE.author.name}](${absoluteUrl(SITE.aboutPath)})`, `${post.slug} raw copyright`);
  assertIncludes(raw, `[${SITE.license.name}](${SITE.license.url})`, `${post.slug} raw license`);

  if (post.isUpdated) {
    const isoDate = formatIsoDate(post.displayDate);
    assertIncludes(html, `datetime="${isoDate}"`, `${post.slug} updated datetime`);
    assertIncludes(
      html,
      `Mis à jour le ${formatDate(post.displayDate)}`,
      `${post.slug} updated label`
    );
  }

  const postSchema = readJsonLd(html)[0] as {
    "@id"?: string;
    inLanguage?: string;
    author?: {
      "@id"?: string;
      jobTitle?: string;
      knowsAbout?: string[];
      sameAs?: string[];
    };
    isPartOf?: { "@id"?: string; name?: string };
    license?: string;
    copyrightYear?: number;
    copyrightHolder?: { "@id"?: string };
  };
  assert.equal(
    postSchema["@id"],
    absoluteUrl(`${post.url}#article`),
    `${post.slug} schema id`
  );
  assert.equal(postSchema.inLanguage, "fr-FR", `${post.slug} schema language`);
  assert.equal(postSchema.author?.["@id"], absoluteUrl("/#person"), `${post.slug} author id`);
  assert.equal(postSchema.author?.jobTitle, SITE.author.jobTitle, `${post.slug} author job title`);
  assert.deepEqual(postSchema.author?.knowsAbout, SITE.author.knowsAbout, `${post.slug} author topics`);
  assert.equal(postSchema.isPartOf?.["@id"], absoluteUrl("/#blog"), `${post.slug} isPartOf blog`);
  assert.equal(postSchema.isPartOf?.name, SITE.blogTitle, `${post.slug} blog name`);
  assert.equal(postSchema.license, SITE.license.url, `${post.slug} license`);
  assert.equal(postSchema.copyrightYear, new Date().getFullYear(), `${post.slug} copyright year`);
  assert.equal(
    postSchema.copyrightHolder?.["@id"],
    absoluteUrl("/#person"),
    `${post.slug} copyright holder`
  );

  const searchItem = searchIndex.find((entry) => entry.url === post.url);
  assert.ok(searchItem, `${post.slug} search entry`);
  assert.equal(
    searchItem?.updated,
    post.isUpdated ? formatIsoDate(post.lastmod) : undefined,
    `${post.slug} search updated date`
  );
  assert.equal(
    searchItem?.updatedLabel,
    post.isUpdated ? `Mis à jour le ${formatDate(post.lastmod)}` : undefined,
    `${post.slug} search updated label`
  );
}


// Canaries: every published post must render its title and a real body, and
// every footnote reference must resolve to a note in the same page.
for (const { post, html } of posts) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
  assert.equal(textOf(h1), normalizeText(post.title), `${post.slug} renders its title`);

  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? "";
  assert.ok(
    textOf(article).split(" ").filter(Boolean).length >= 100,
    `${post.slug} renders a non-empty body`
  );

  const notes = html.match(/<section[^>]*data-footnotes[\s\S]*?<\/section>/)?.[0] ?? "";
  const noteIds = new Set(
    [...notes.matchAll(/id="([^"]+)"/g)].map((match) => match[1])
  );
  const refs = [...html.matchAll(/<a[^>]*data-footnote-ref[^>]*>/g)].map(
    (match) => match[0]
  );

  if (notes) {
    assert.ok(refs.length > 0, `${post.slug} renders footnote references`);

    for (const ref of refs) {
      const target = ref.match(/href="#([^"]+)"/)?.[1];
      assert.ok(
        target && noteIds.has(target),
        `${post.slug} footnote reference resolves`
      );
    }

    for (const backref of notes.matchAll(/<a[^>]*data-footnote-backref[^>]*>/g)) {
      const target = backref[0].match(/href="#([^"]+)"/)?.[1];
      assert.ok(
        target && new RegExp(`id="${target}"`).test(html),
        `${post.slug} footnote backlink resolves`
      );
    }
  } else {
    assert.equal(refs.length, 0, `${post.slug} renders no dangling footnote reference`);
  }
}

assert.ok(
  !redirects.includes("https://www.alnah.me/* https://alnah.me/:splat 301"),
  "_redirects should not contain the legacy absolute www redirect under Cloudflare Pages"
);
assert.ok(!redirects.includes("/reuse-notes/"), "Removed fixture aliases must not remain in redirects");
assert.ok(!redirects.includes("/hidden-draft/"), "Draft aliases must not appear in redirects");
assertIncludes(redirects, "/about/ /a-propos/ 301", "_redirects legacy about");
assertIncludes(redirects, "/privacy/ /confidentialite/ 301", "_redirects legacy privacy");
assertIncludes(redirects, "/posts/* /articles/ 301", "_redirects legacy posts");
assertIncludes(redirects, "/tags/* /articles/ 301", "_redirects legacy tags");
assertIncludes(redirects, "/LICENSE /LICENSE.txt 301", "_redirects license text");
assertIncludes(headers, "Content-Security-Policy:", "_headers CSP");
assert.ok(cspLine, "_headers should include a CSP line");
assert.ok(
  !/script-src[^;]*'unsafe-inline'/.test(cspLine),
  "_headers should not allow unsafe-inline in script-src"
);
for (const hash of inlineScriptHashes) {
  assertIncludes(headers, hash, `_headers CSP hash ${hash}`);
}
assertIncludes(headers, "Referrer-Policy: strict-origin-when-cross-origin", "_headers referrer policy");
assertIncludes(headers, "X-Content-Type-Options: nosniff", "_headers nosniff");
assertIncludes(headers, "Permissions-Policy:", "_headers permissions policy");
assertIncludes(headers, "Strict-Transport-Security:", "_headers HSTS");
assertIncludes(headers, "X-Frame-Options: DENY", "_headers frame deny");
assertIncludes(headers, "Cross-Origin-Resource-Policy: same-origin", "_headers CORP");
assertIncludes(
  headerSection(headers, "/*.html"),
  "Cache-Control: public, max-age=0, must-revalidate",
  "_headers html cache policy"
);
assertIncludes(
  headerSection(headers, "/rss.xml"),
  "X-Robots-Tag: noindex",
  "_headers rss noindex"
);
assertIncludes(
  headerSection(headers, "/index.json"),
  "X-Robots-Tag: noindex",
  "_headers search index noindex"
);
assertIncludes(
  headerSection(headers, "/raw/posts/*"),
  "X-Robots-Tag: noindex",
  "_headers raw posts noindex"
);
assertIncludes(headers, "/LICENSES/*", "_headers license section");
assertIncludes(headerSection(headers, "/raw/posts/:slug.md"), 'Link: </articles/:slug/>; rel="canonical"', "_headers raw canonical link");
assertIncludes(robots, `Sitemap: ${absoluteUrl("/sitemap-index.xml")}`, "robots sitemap");
assertIncludes(robots, "Disallow: /cdn-cgi/", "robots cdn-cgi disallow");
assertIncludes(
  homeHtml,
  '<link rel="sitemap" href="/sitemap-index.xml">',
  "head sitemap link"
);
assertIncludes(
  redirects,
  "/sitemap.xml /sitemap-index.xml 301",
  "_redirects sitemap alias"
);
assert.ok(
  !fs.existsSync(path.join(process.cwd(), "dist/sitemap.xml")),
  "/sitemap.xml must stay a redirect, not a duplicated sitemap file"
);

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

// Every published post owns exactly one raw export, social image, search
// document, and feed item.
assert.deepEqual(
  fs.readdirSync(path.join(process.cwd(), "dist/raw/posts")).sort(),
  PUBLISHED_POSTS.map((post) => `${post.slug}.md`).sort(),
  "raw exports match the published posts"
);
assert.deepEqual(
  fs.readdirSync(path.join(process.cwd(), "dist/og/articles")).sort(),
  PUBLISHED_POSTS.map((post) => `${post.slug}.png`).sort(),
  "social images match the published posts"
);
assert.deepEqual(
  searchIndex.map((item) => item.url).sort(),
  PUBLISHED_POSTS.map((post) => post.url).sort(),
  "search documents match the published posts"
);
const rssLinks = [...readFile("dist/rss.xml").matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)]
  .map((match) => match[1])
  .sort();
assert.deepEqual(
  rssLinks,
  PUBLISHED_POSTS.map((post) => absoluteUrl(post.url)).sort(),
  "feed items match the published posts"
);

// Redirects must land on something that exists.
for (const line of redirects.split("\n").filter(Boolean)) {
  const [from, to] = line.split(/\s+/);

  if (!to || /^https?:\/\//.test(to) || to.includes("*") || to.includes(":")) {
    continue;
  }

  const target = to.endsWith("/")
    ? path.join(process.cwd(), "dist", to, "index.html")
    : path.join(process.cwd(), "dist", to.replace(/^\//, ""));

  assert.ok(fs.existsSync(target), `redirect target exists: ${from} -> ${to}`);
}

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

// Duplicate ids break anchors and accessibility.
for (const file of htmlFiles()) {
  const ids = [...readFile(path.relative(process.cwd(), file)).matchAll(/ id="([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.equal(
    new Set(ids).size,
    ids.length,
    `${path.relative(process.cwd(), file)} must not contain duplicate ids`
  );
}

assertInternalLinks();

// Sitemap contract: no indexable URL is noindex, and no built page is noindex.
for (const htmlPath of htmlFiles()) {
  assert.ok(
    !readFile(path.relative(process.cwd(), htmlPath)).includes("noindex"),
    `${path.relative(process.cwd(), htmlPath)} must stay indexable`
  );
}
assert.equal(license, readFile("LICENSE"), "LICENSE is copied byte for byte");
assert.deepEqual(
  fs.readdirSync("dist/LICENSES").sort(),
  fs.readdirSync("LICENSES").sort(),
  "LICENSES directory is copied as a whole"
);
for (const name of fs.readdirSync("LICENSES")) {
  assert.equal(
    readFile(`dist/LICENSES/${name}`),
    readFile(`LICENSES/${name}`),
    `${name} is copied byte for byte`
  );
}
assert.ok(!homeHtml.includes("fonts.googleapis.com"), "Home should not use third-party Google Fonts");

assert.ok(Array.isArray(searchIndex), "Search index should be an array");

assertIncludes(aboutHtml, 'class="external-link"', "external link class");
assertIncludes(aboutHtml, 'target="_blank" rel="noopener"', "external link new tab");
assertIncludes(aboutHtml, 'class="external-link-icon"', "external link icon");
assertIncludes(aboutHtml, "ouvre dans un nouvel onglet)", "external link accessible name");
assert.ok(
  !homeHtml.includes('class="external-link"'),
  "internal-only pages must not mark links as external"
);

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

const activitySection = aboutHtml.match(/<section[^>]*class="github-activity"/);
const activityList = aboutHtml.match(/<ul class="activity-list"[^>]*>([\s\S]*?)<\/ul>/);

assert.ok(
  !activitySection || (activityList && /<li[\s>]/.test(activityList[1])),
  "GitHub activity section must not render an empty list"
);

console.log("test:build passed");
