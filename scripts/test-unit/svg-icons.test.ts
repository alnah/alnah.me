import assert from "node:assert/strict";
import test from "node:test";
import {
  EXTERNAL_LINK_ICON,
  PAN_UP_ICON,
  strokeIconHast,
  strokeIconMarkup,
  ZOOM_IN_ICON
} from "../../src/lib/svg-icons.ts";

/** One stroke-icon factory for Markdown, markup, and the diagram runtime. */
test("svg icons: shared geometry and markup", () => {
  assert.equal(EXTERNAL_LINK_ICON.shapes.length, 2);
  assert.equal(EXTERNAL_LINK_ICON.size, 16);

  const markup = strokeIconMarkup(ZOOM_IN_ICON);
  assert.match(markup, /^<svg width="18" height="18" viewBox="0 0 24 24"/);
  assert.match(markup, /stroke-width="2"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /<circle cx="11" cy="11" r="7"><\/circle>/);
  assert.match(markup, /<line x1="8" y1="11" x2="14" y2="11"><\/line>/);

  assert.match(strokeIconMarkup(PAN_UP_ICON), /^<svg width="16" height="16"/);
  assert.match(
    strokeIconMarkup(EXTERNAL_LINK_ICON, { className: "icon", stroke: "red" }),
    /class="icon"/
  );

  const hast = strokeIconHast(EXTERNAL_LINK_ICON, { className: "external-link-icon" });
  assert.equal(hast.tagName, "span");
  assert.deepEqual(hast.properties?.className, ["external-link-icon"]);
  assert.equal(hast.properties?.ariaHidden, "true");

  const svg = hast.children[0];
  assert.equal(svg.type, "element");
  assert.equal(svg.tagName, "svg");
  assert.equal(svg.properties?.viewBox, "0 0 24 24");
  assert.equal(svg.properties?.strokeWidth, "2");
  assert.equal(svg.children.length, 2);
});
