import assert from "node:assert/strict";
import { serializeJsonForHtmlScript } from "../../src/lib/script-safe.ts";

/** JSON embedded in HTML script tags must not break out of the tag. */
export function testHtml(): void {
  const serialized = serializeJsonForHtmlScript({
    title: '</script><script>alert("xss")</script>',
    ampersand: "R&D"
  });

  assert.ok(!serialized.includes("</script>"), "serializer should not emit a closing script tag");
  assert.ok(serialized.includes("\\u003C/script\\u003E"), "serializer should escape script endings");
  assert.ok(serialized.includes("R\\u0026D"), "serializer should escape ampersands");
}
