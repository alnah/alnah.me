import assert from "node:assert/strict";
import test from "node:test";
import { renderSocialImage } from "../../src/lib/social-image.ts";

function pngDimensions(buffer: Uint8Array) {
  assert.equal(
    Buffer.from(buffer.subarray(1, 4)).toString("ascii"),
    "PNG",
    "the renderer must produce a PNG"
  );

  const view = Buffer.from(buffer);
  return {
    width: view.readUInt32BE(16),
    height: view.readUInt32BE(20)
  };
}

test("social image: extreme text still renders the card size", async () => {
  const inputs = [
    {
      title: "",
      description: "",
      authorName: ""
    },
    {
      title: "Un titre sans espace ".repeat(20),
      description: "Description très longue ".repeat(60),
      authorName: "Alexis Nahan"
    },
    {
      title: "Titre avec accents, apostrophes et tirets — test",
      description: "Résumé court.",
      authorName: "alnah"
    }
  ];

  for (const input of inputs) {
    const dimensions = pngDimensions(await renderSocialImage(input));
    assert.deepEqual(dimensions, { width: 1200, height: 630 });
  }
});
