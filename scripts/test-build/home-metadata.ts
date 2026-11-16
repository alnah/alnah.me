import assert from "node:assert/strict";
import { SITE } from "../../src/config/site.ts";
import { absoluteUrl } from "../build-expectations.ts";
import {
  anchorHrefs,
  attr,
  byTag,
  elements,
  hasClass,
  jsonLd,
  normalizeText,
  textContent
} from "../page-dom.ts";
import { assertIncludes } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

/** Home metadata, contact icons, discovery links, and local assets. */
export function checkHomeMetadata({ home, homeHtml }: BuiltSite): void {
  const websiteSchema = jsonLd(home)[0] as {
    "@id"?: string;
    inLanguage?: string;
  };
  assert.equal(websiteSchema["@id"], absoluteUrl("/#website"), "website schema id");
  assert.equal(websiteSchema.inLanguage, "fr-FR", "website schema language");

  const ariaLabels = (doc: typeof home) =>
    new Set(
      elements(doc, (element) => attr(element, "aria-label") !== undefined).map(
        (element) => attr(element, "aria-label")
      )
    );

  for (const contact of SITE.contacts) {
    assert.ok(
      ariaLabels(home).has(contact.label),
      `home contact icon ${contact.label}`
    );
  }

  assert.match(normalizeText(textContent(home)), /Me suivre sur/);
  assert.match(normalizeText(textContent(home)), /Me contacter par/);

  const rssLink = byTag(home, "link").find(
    (link) => attr(link, "type") === "application/rss+xml"
  );
  assert.ok(rssLink, "home declares its RSS feed");
  assert.equal(attr(rssLink, "href"), absoluteUrl("/rss.xml"), "home RSS href");

  for (const marker of ["data-search-trigger", "data-search-root", "data-theme-toggle"]) {
    assert.ok(
      elements(home, (element) => attr(element, marker) !== undefined).length > 0,
      `home exposes ${marker}`
    );
  }

  assertIncludes(
    homeHtml,
    '<link rel="sitemap" href="/sitemap-index.xml">',
    "head sitemap link"
  );

  const homeLinks = [
    ...byTag(home, "link").map((link) => attr(link, "href") ?? ""),
    ...anchorHrefs(home)
  ];
  assert.ok(
    !homeLinks.some((href) => href.includes("fonts.googleapis.com")),
    "home must not load third-party Google Fonts"
  );

  assert.equal(
    byTag(home, "a").filter((anchor) => hasClass(anchor, "external-link")).length,
    0,
    "internal-only pages must not mark links as external"
  );
}
