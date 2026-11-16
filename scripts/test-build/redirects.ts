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
  assert.ok(
    !fs.existsSync(path.join(process.cwd(), "dist/sitemap.xml")),
    "/sitemap.xml must stay a redirect, not a duplicated sitemap file"
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
}
