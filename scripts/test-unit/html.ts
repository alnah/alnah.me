import assert from "node:assert/strict";
import { pageIdSuffix } from "../../src/lib/dom-id.ts";
import { serializeJsonForHtmlScript } from "../../src/lib/script-safe.ts";

/** JSON embedded in HTML script tags and stable per-page DOM ids. */
export function testHtml(): void {
  const serialized = serializeJsonForHtmlScript({
    title: '</script><script>alert("xss")</script>',
    ampersand: "R&D"
  });

  assert.ok(!serialized.includes("</script>"), "serializer should not emit a closing script tag");
  assert.ok(serialized.includes("\\u003C/script\\u003E"), "serializer should escape script endings");
  assert.ok(serialized.includes("R\\u0026D"), "serializer should escape ampersands");

  assert.equal(pageIdSuffix("/"), "home", "the home page gets a stable id");
  assert.equal(pageIdSuffix("/articles/hello/"), "articles-hello", "path separators collapse");
  assert.equal(pageIdSuffix("/a b/"), "a-b", "spaces collapse to a dash");
}
