import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertIncludes } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Redirect artifacts and their on-disk targets. */
export function checkRedirects({ redirects }: BuiltSite): void {
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
  assertIncludes(
    redirects,
    "/sitemap.xml /sitemap-index.xml 301",
    "_redirects sitemap alias"
  );
  const sitemapAlias = path.join(process.cwd(), "dist/sitemap.xml");
  assert.ok(
    !fs.existsSync(sitemapAlias) || fs.statSync(sitemapAlias).isDirectory(),
    "/sitemap.xml must stay a redirect, not a duplicated sitemap file"
  );
  // Redirects must land on something that exists, and Astro must replay every
  // concrete rule as a static meta-refresh page.
  for (const line of redirects.split("\n").filter(Boolean)) {
    const [from, to] = line.split(/\s+/);

    if (
      !to ||
      /^https?:\/\//.test(to) ||
      from.includes("*") ||
      to.includes("*") ||
      to.includes(":")
    ) {
      continue;
    }

    const target = to.endsWith("/")
      ? path.join(process.cwd(), "dist", to, "index.html")
      : path.join(process.cwd(), "dist", to.replace(/^\//, ""));

    assert.ok(fs.existsSync(target), `redirect target exists: ${from} -> ${to}`);

    const redirectPage = path.join(
      process.cwd(),
      "dist",
      from.replace(/^\//, ""),
      "index.html"
    );
    assert.ok(fs.existsSync(redirectPage), `redirect page exists: ${from}`);
    assert.ok(
      fs.readFileSync(redirectPage, "utf8").includes(`url=${to}`),
      `redirect page points to ${to}: ${from}`
    );
  }
}
