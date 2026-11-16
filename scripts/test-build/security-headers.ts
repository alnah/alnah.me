import assert from "node:assert/strict";
import { absoluteUrl } from "../build-expectations.ts";
import { assertIncludes, headerSection } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Security headers, CSP hashes, and the robots policy. */
export function checkSecurityHeaders({ headers, robots, inlineScriptHashes, cspLine }: BuiltSite): void {
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
}
