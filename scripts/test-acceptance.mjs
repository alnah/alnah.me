import assert from "node:assert/strict";
import {
  assertFile,
  assertIncludes,
  executableInlineScriptHashes,
  readFile,
  readJson
} from "./checks.mjs";

const requiredFiles = [
  "dist/index.html",
  "dist/index.json",
  "dist/rss.xml",
  "dist/sitemap-index.xml",
  "dist/robots.txt",
  "dist/_redirects",
  "dist/LICENSE",
  "dist/LICENSES/BSD-3-Clause.txt",
  "dist/LICENSES/CC-BY-4.0.txt",
  "dist/about/index.html",
  "dist/privacy/index.html"
];

for (const file of requiredFiles) {
  assertFile(file);
}

const homeHtml = readFile("dist/index.html");
const aboutHtml = readFile("dist/about/index.html");
const redirects = readFile("dist/_redirects");
const headers = readFile("dist/_headers");
const robots = readFile("dist/robots.txt");
const license = readFile("dist/LICENSE");
const bsdLicense = readFile("dist/LICENSES/BSD-3-Clause.txt");
const ccLicense = readFile("dist/LICENSES/CC-BY-4.0.txt");
const searchIndex = readJson("dist/index.json");
const inlineScriptHashes = executableInlineScriptHashes("dist/index.html");
const cspLine = headers
  .split("\n")
  .find((line) => line.trimStart().startsWith("Content-Security-Policy:"));

for (const label of ["GitHub", "X", "Bluesky", "Mastodon", "LinkedIn", "Email", "RSS"]) {
  assertIncludes(homeHtml, `aria-label="${label}"`, `home social icon ${label}`);
  assertIncludes(aboutHtml, `aria-label="${label}"`, `about social icon ${label}`);
}
assertIncludes(homeHtml, 'href="/rss.xml"', "home footer RSS href");

assert.ok(
  !redirects.includes("https://www.alnah.me/* https://alnah.me/:splat 301"),
  "_redirects should not contain the legacy absolute www redirect under Workers assets"
);
assert.ok(!redirects.includes("/reuse-notes/"), "Removed fixture aliases must not remain in redirects");
assert.ok(!redirects.includes("/hidden-draft/"), "Draft aliases must not appear in redirects");
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
assertIncludes(headers, "/LICENSES/*", "_headers license section");
assertIncludes(headers, "/raw/posts/*", "_headers raw posts section");
assertIncludes(headers, "X-Robots-Tag: noindex, nofollow", "_headers raw posts noindex");
assertIncludes(robots, "Sitemap: https://alnah.me/sitemap-index.xml", "robots sitemap");
assertIncludes(robots, "Disallow: /index.json", "robots index disallow");
assertIncludes(robots, "Disallow: /raw/posts/", "robots raw disallow");
assertIncludes(license, 'Alexis Nahan (alias "alnah") <alexis.nahan@gmail.com>', "LICENSE");
assertIncludes(license, "LICENSES/BSD-3-Clause.txt", "LICENSE BSD pointer");
assertIncludes(license, "LICENSES/CC-BY-4.0.txt", "LICENSE CC pointer");
assertIncludes(bsdLicense, "BSD 3-Clause License", "BSD license file");
assertIncludes(ccLicense, "Attribution 4.0 International", "CC license file");
assert.ok(!homeHtml.includes("fonts.googleapis.com"), "Home should not use third-party Google Fonts");

assert.ok(Array.isArray(searchIndex), "Search index should be an array");

console.log("test:acceptance passed");
