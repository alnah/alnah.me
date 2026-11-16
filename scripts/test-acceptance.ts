import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SITE } from "../src/config/site.ts";
import { formatDate, formatIsoDate } from "../src/lib/content/format.ts";
import {
  absoluteUrl,
  EMPTY_CATEGORY_PATHS,
  PUBLISHED_CATEGORIES,
  PUBLISHED_POSTS
} from "./build-expectations.ts";
import {
  assertFile,
  assertIncludes,
  executableInlineScriptHashes,
  htmlFiles,
  readFile,
  readJson,
  readJsonLd,
  readPngDimensions
} from "./test-helpers.ts";

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
const bsdLicense = readFile("dist/LICENSES/BSD-3-Clause.txt");
const ccLicense = readFile("dist/LICENSES/CC-BY-4.0.txt");
const searchIndex = readJson<
  Array<{ url: string; updated?: string; updatedLabel?: string }>
>("dist/index.json");
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
  mainEntity?: { "@id"?: string };
};
assert.equal(profileSchema["@type"], "ProfilePage", "profile page type");
assert.equal(profileSchema.inLanguage, "fr-FR", "profile page language");
assert.equal(
  profileSchema.mainEntity?.["@id"],
  absoluteUrl("/#person"),
  "profile person id"
);

for (const label of ["GitHub", "X", "YouTube", "TikTok", "LinkedIn", "E-mail"]) {
  assertIncludes(homeHtml, `aria-label="${label}"`, `home contact icon ${label}`);
  assertIncludes(aboutHtml, `aria-label="${label}"`, `about contact icon ${label}`);
}
assertIncludes(homeHtml, "Me suivre sur", "home social label");
assertIncludes(homeHtml, "Me contacter par", "home contact label");
assertIncludes(aboutHtml, "Me suivre sur", "about social label");
assertIncludes(aboutHtml, "Me contacter par", "about contact label");
assertIncludes(homeHtml, `href="${absoluteUrl("/rss.xml")}"`, "home RSS href");

for (const { post, html, raw } of posts) {
  assertIncludes(html, "data-footnotes", `${post.slug} footnotes section`);
  assertIncludes(html, 'role="doc-endnotes"', `${post.slug} footnotes role`);
  assertIncludes(html, 'class="footnote-ref"', `${post.slug} footnote marker`);
  assertIncludes(html, 'class="footnote-backref-icon"', `${post.slug} backlink icon`);

  const ogImage = absoluteUrl(post.socialImagePath);
  assertIncludes(html, `property="og:image" content="${ogImage}"`, `${post.slug} og:image`);
  assertIncludes(html, '"image":"' + ogImage + '"', `${post.slug} schema image`);
  assertIncludes(html, 'property="og:image:width" content="1200"', `${post.slug} og:image width`);
  assertIncludes(html, 'property="og:image:height" content="630"', `${post.slug} og:image height`);

  const dimensions = readPngDimensions(`dist${post.socialImagePath}`);
  assert.equal(dimensions.width, 1200, `${post.slug} og image width`);
  assert.equal(dimensions.height, 630, `${post.slug} og image height`);

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

// Editorial canaries kept until the content assertions are removed.
const noted = posts.find(({ html }) => html.includes("data-footnotes"));
if (noted) {
  assertIncludes(noted.html, 'aria-label="Note 1"', "post footnote marker label");
  assertIncludes(noted.html, 'aria-label="Retour au texte, note 1"', "post footnote backlink label");
  const puren = posts.find(({ raw }) => raw.includes("[^puren]"));
  if (puren) {
    assertIncludes(puren.raw, "[^puren]: Christian Puren", "raw post footnote definition");
  }
  assert.ok(
    !noted.raw.includes("## Références"),
    "raw post footnotes should not add a repeated heading"
  );
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
assertIncludes(headers, "/rss.xml", "_headers rss section");
assertIncludes(headers, "X-Robots-Tag: noindex", "_headers index noindex");
const rssHeaderSection = headers
  .split("\n\n")
  .find((section) => section.startsWith("/rss.xml"));
assert.ok(rssHeaderSection?.includes("X-Robots-Tag: noindex"), "_headers rss noindex");
assertIncludes(headers, "/LICENSES/*", "_headers license section");
assertIncludes(headers, "/raw/posts/*", "_headers raw posts section");
assertIncludes(headers, "X-Robots-Tag: noindex", "_headers raw posts noindex");
assertIncludes(headers, "/raw/posts/:slug.md", "_headers raw posts canonical section");
assertIncludes(headers, 'Link: </articles/:slug/>; rel="canonical"', "_headers raw canonical link");
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

// Sitemap contract: no indexable URL is noindex, and no built page is noindex.
for (const htmlPath of htmlFiles()) {
  assert.ok(
    !readFile(path.relative(process.cwd(), htmlPath)).includes("noindex"),
    `${path.relative(process.cwd(), htmlPath)} must stay indexable`
  );
}
assertIncludes(license, `Alexis Nahan (alias "alnah") <alexis.nahan@gmail.com>`, "LICENSE");
assertIncludes(license, "LICENSES/BSD-3-Clause.txt", "LICENSE BSD pointer");
assertIncludes(license, "LICENSES/CC-BY-4.0.txt", "LICENSE CC pointer");
assertIncludes(bsdLicense, "BSD 3-Clause License", "BSD license file");
assertIncludes(ccLicense, "Attribution 4.0 International", "CC license file");
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

console.log("test:acceptance passed");
