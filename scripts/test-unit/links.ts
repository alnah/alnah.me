import assert from "node:assert/strict";
import { classifyLink, externalLinkAttributes, NEW_TAB_NOTE } from "../../src/lib/links.ts";

/** External link classification and the new-tab attributes. */
export function testLinks(): void {
  const origin = "https://alnah.me";

  assert.equal(classifyLink("https://example.com/a", origin), "external");
  assert.equal(classifyLink("//example.com/a", origin), "external");
  assert.equal(classifyLink("https://alnah.me/articles/", origin), "internal");
  assert.equal(classifyLink("/articles/", origin), "internal");
  assert.equal(classifyLink("#section", origin), "internal");
  assert.equal(classifyLink("mailto:contact@alnah.me", origin), "ignore");
  assert.equal(classifyLink("tel:+33123456789", origin), "ignore");
  assert.equal(classifyLink("javascript:alert(1)", origin), "ignore");

  const attributes = externalLinkAttributes("https://example.com", origin, " Exemple ");
  assert.equal(attributes?.target, "_blank");
  assert.equal(attributes?.rel, "noopener");
  assert.equal(attributes?.ariaLabel, `Exemple${NEW_TAB_NOTE}`);
  assert.equal(externalLinkAttributes("/articles/", origin, "Articles"), null);
  assert.equal(externalLinkAttributes("mailto:x@y.z", origin, "Écrire"), null);
}
