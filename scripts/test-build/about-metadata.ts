import assert from "node:assert/strict";
import { SITE, SOCIAL_CONTACT_IDS } from "../../src/config/site.ts";
import { absoluteUrl } from "../build-expectations.ts";
import {
  attr,
  byTag,
  elements,
  hasClass,
  jsonLd,
  normalizeText,
  textContent
} from "../page-dom.ts";
import type { BuiltSite } from "./built-site.ts";

/** About metadata, contact icons, external links, and GitHub activity. */
export function checkAboutMetadata({ about, aboutHtml }: BuiltSite): void {
  const profileSchema = jsonLd(about)[0] as {
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

  const ariaLabels = new Set(
    elements(about, (element) => attr(element, "aria-label") !== undefined).map(
      (element) => attr(element, "aria-label")
    )
  );

  for (const contact of SITE.contacts) {
    assert.ok(
      ariaLabels.has(contact.label),
      `about contact icon ${contact.label}`
    );
  }

  assert.match(normalizeText(textContent(about)), /Me suivre sur/);
  assert.match(normalizeText(textContent(about)), /Me contacter par/);

  const externalLinks = byTag(about, "a").filter((anchor) => hasClass(anchor, "external-link"));
  assert.ok(externalLinks.length > 0, "about page marks external links");
  for (const anchor of externalLinks) {
    assert.equal(attr(anchor, "target"), "_blank", "external link opens in a new tab");
    assert.match(attr(anchor, "rel") ?? "", /noopener/, "external link uses noopener");
    assert.match(attr(anchor, "aria-label") ?? "", /ouvre dans un nouvel onglet/, "external link accessible name");
    assert.equal(
      elements(anchor, (element) => hasClass(element, "external-link-icon")).length,
      1,
      "external link carries its icon"
    );
  }

  const activitySection = aboutHtml.match(/<section[^>]*class="github-activity"/);
  const activityList = aboutHtml.match(/<ul class="activity-list"[^>]*>([\s\S]*?)<\/ul>/);

  assert.ok(
    !activitySection || (activityList && /<li[\s>]/.test(activityList[1])),
    "GitHub activity section must not render an empty list"
  );
}
