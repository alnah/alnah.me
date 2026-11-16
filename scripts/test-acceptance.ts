import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
  "dist/LICENSE.txt",
  "dist/LICENSES/BSD-3-Clause.txt",
  "dist/LICENSES/CC-BY-4.0.txt",
  "dist/a-propos/index.html",
  "dist/confidentialite/index.html",
  "dist/articles/perspective-actionnelle/index.html",
  "dist/raw/posts/perspective-actionnelle.md",
  "dist/og/articles/perspective-actionnelle.png",
  "dist/og/articles/cecrl.png"
];

for (const file of requiredFiles) {
  assertFile(file);
}

const homeHtml = readFile("dist/index.html");
const aboutHtml = readFile("dist/a-propos/index.html");
const perspectiveHtml = readFile("dist/articles/perspective-actionnelle/index.html");
const perspectiveRaw = readFile("dist/raw/posts/perspective-actionnelle.md");
const cecrlHtml = readFile("dist/articles/cecrl/index.html");
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

const websiteSchema = readJsonLd(homeHtml)[0] as {
  "@id"?: string;
  inLanguage?: string;
};
assert.equal(websiteSchema["@id"], "https://alnah.me/#website", "website schema id");
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
  "https://alnah.me/#person",
  "profile person id"
);

for (const label of ["GitHub", "X", "YouTube", "TikTok", "LinkedIn", "E-mail"]) {
  assertIncludes(homeHtml, `aria-label="${label}"`, `home contact icon ${label}`);
  assertIncludes(aboutHtml, `aria-label="${label}"`, `about contact icon ${label}`);
}
assertIncludes(homeHtml, 'Me suivre sur', 'home social label');
assertIncludes(homeHtml, 'Me contacter par', 'home contact label');
assertIncludes(aboutHtml, 'Me suivre sur', 'about social label');
assertIncludes(aboutHtml, 'Me contacter par', 'about contact label');
assertIncludes(homeHtml, 'href="https://alnah.me/rss.xml"', "home RSS href");

assertIncludes(perspectiveHtml, "data-footnotes", "post footnotes section");
assertIncludes(perspectiveHtml, 'role="doc-endnotes"', "post footnotes role");
assertIncludes(perspectiveHtml, 'class="footnote-ref"', "post footnote marker");
assertIncludes(perspectiveHtml, 'aria-label="Note 1"', "post footnote marker label");
assertIncludes(perspectiveHtml, 'datetime="2026-11-15"', "post updated datetime");
assertIncludes(perspectiveHtml, "Mis à jour le 15 nov. 2026", "post updated label");
for (const slug of ["perspective-actionnelle", "cecrl"]) {
  const dimensions = readPngDimensions(`dist/og/articles/${slug}.png`);
  assert.equal(dimensions.width, 1200, `${slug} og image width`);
  assert.equal(dimensions.height, 630, `${slug} og image height`);
}
assertIncludes(
  perspectiveHtml,
  'property="og:image" content="https://alnah.me/og/articles/perspective-actionnelle.png"',
  "post og:image"
);
assertIncludes(
  perspectiveHtml,
  'property="og:image:width" content="1200"',
  "post og:image width"
);
assertIncludes(
  perspectiveHtml,
  'property="og:image:height" content="630"',
  "post og:image height"
);
assertIncludes(
  perspectiveHtml,
  '"image":"https://alnah.me/og/articles/perspective-actionnelle.png"',
  "post schema image"
);

const postSchema = readJsonLd(perspectiveHtml)[0] as {
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
  "https://alnah.me/articles/perspective-actionnelle/#article",
  "post schema id"
);
assert.equal(postSchema.inLanguage, "fr-FR", "post schema language");
assert.equal(postSchema.author?.["@id"], "https://alnah.me/#person", "post author id");
assert.equal(
  postSchema.author?.jobTitle,
  "Professeur de français langue étrangère et développeur logiciel",
  "post author job title"
);
assert.deepEqual(
  postSchema.author?.knowsAbout,
  [
    "Français langue étrangère (FLE)",
    "Didactique des langues",
    "Ingénierie pédagogique",
    "Technologies éducatives"
  ],
  "post author knowsAbout"
);
assert.equal(postSchema.isPartOf?.["@id"], "https://alnah.me/#blog", "post isPartOf blog");
assert.equal(postSchema.isPartOf?.name, "Le FLE et la tech", "blog name");
assert.equal(
  postSchema.license,
  "https://creativecommons.org/licenses/by/4.0/",
  "post license"
);
assert.equal(
  postSchema.copyrightYear,
  new Date().getFullYear(),
  "post copyright year"
);
assert.equal(
  postSchema.copyrightHolder?.["@id"],
  "https://alnah.me/#person",
  "post copyright holder"
);
assertIncludes(
  perspectiveHtml,
  'aria-label="Retour au texte, note 1"',
  "post footnote backlink label"
);
assertIncludes(perspectiveHtml, 'class="footnote-backref-icon"', "post footnote backlink icon");
assert.ok(
  !perspectiveHtml.includes("Footnotes") && !perspectiveHtml.includes(">Notes<"),
  "post footnotes should not render a visible or hidden heading"
);
assertIncludes(perspectiveRaw, "[^puren]: Christian Puren", "raw post footnote definition");
assertIncludes(
  perspectiveRaw,
  `© ${new Date().getFullYear()} [Alexis Nahan](https://alnah.me/a-propos/)`,
  "raw post copyright"
);
assertIncludes(
  perspectiveRaw,
  "[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)",
  "raw post license"
);
assert.ok(
  !perspectiveRaw.includes("## Références"),
  "raw post footnotes should not add a repeated heading"
);
assertIncludes(cecrlHtml, "data-footnotes", "CECRL post footnotes section");
assertIncludes(cecrlHtml, 'aria-label="Note 2"', "CECRL volume footnote marker");
assertIncludes(cecrlHtml, 'datetime="2026-11-15"', "CECRL updated datetime");
assertIncludes(cecrlHtml, "Mis à jour le 15 nov. 2026", "CECRL updated label");
assertIncludes(
  cecrlHtml,
  'property="og:image" content="https://alnah.me/og/articles/cecrl.png"',
  "CECRL og:image"
);

for (const slug of ["cecrl", "perspective-actionnelle"]) {
  const item = searchIndex.find((entry) => entry.url === `/articles/${slug}/`);
  assert.equal(item?.updated, "2026-11-15", `${slug} search updated date`);
  assert.equal(
    item?.updatedLabel,
    "Mis à jour le 15 nov. 2026",
    `${slug} search updated label`
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
assertIncludes(redirects, "/articles/le-cecrl/ /articles/cecrl/ 301", "_redirects CECRL alias");
assertIncludes(
  redirects,
  "/raw/posts/la-perspective-actionnelle.md /raw/posts/perspective-actionnelle.md 301",
  "_redirects renamed raw export"
);
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
assertIncludes(robots, "Sitemap: https://alnah.me/sitemap-index.xml", "robots sitemap");
assertIncludes(robots, "Disallow: /cdn-cgi/", "robots cdn-cgi disallow");
assertIncludes(
  homeHtml,
  '<link rel="sitemap" href="/sitemap-index.xml">',
  "head sitemap link"
);
assert.ok(
  !fs.existsSync(path.join(process.cwd(), "dist/sitemap.xml")),
  "/sitemap.xml stays unaliased: the index is the single sitemap entrypoint"
);

const sitemapXml = readFile("dist/sitemap-0.xml");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1]
);
// Fixture contract: these categories currently have no published post. Their
// archive is a noindex placeholder, so the sitemap must not advertise them.
for (const emptyCategory of ["construire", "outiller", "penser", "travailler"]) {
  assert.ok(
    !sitemapUrls.includes(`https://alnah.me/categories/${emptyCategory}/`),
    `sitemap must not advertise the empty category ${emptyCategory}`
  );
}
assert.ok(
  sitemapUrls.includes("https://alnah.me/categories/enseigner/"),
  "sitemap must advertise populated categories"
);

const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
  (match) => match[1]
);
const cecrlEntry = sitemapEntries.find((entry) =>
  entry.includes("<loc>https://alnah.me/articles/cecrl/</loc>")
);
assert.ok(cecrlEntry, "sitemap should list the cecrl post");
assertIncludes(
  cecrlEntry,
  `<lastmod>${new Date("2026-11-15T00:00:00Z").toISOString()}</lastmod>`,
  "sitemap lastmod uses the post lastmod"
);
for (const entry of sitemapEntries) {
  if (entry.includes("<loc>https://alnah.me/articles/")) {
    assertIncludes(entry, "<lastmod>", "every listed post carries a lastmod");
  }
}

// Empty archives are not pages: they must not exist and must not be linked.
for (const emptyCategory of ["construire", "outiller", "penser", "travailler"]) {
  assert.ok(
    !fs.existsSync(path.join(process.cwd(), `dist/categories/${emptyCategory}/index.html`)),
    `empty category ${emptyCategory} must not be generated`
  );
  assert.ok(
    !readFile("dist/categories/index.html").includes(`/categories/${emptyCategory}/`),
    `the category index must not link the empty category ${emptyCategory}`
  );
}
assertFile("dist/categories/enseigner/index.html");

// Sitemap contract: no indexable URL is noindex, and no built page is noindex.
for (const htmlPath of htmlFiles()) {
  assert.ok(
    !readFile(path.relative(process.cwd(), htmlPath)).includes("noindex"),
    `${path.relative(process.cwd(), htmlPath)} must stay indexable`
  );
}
assertIncludes(license, 'Alexis Nahan (alias "alnah") <alexis.nahan@gmail.com>', "LICENSE");
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
