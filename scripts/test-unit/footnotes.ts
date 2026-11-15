import assert from "node:assert/strict";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { footnotes } from "../../src/lib/markdown/footnotes.ts";

export async function testFootnotes(): Promise<void> {
  const processor = await createSatteriMarkdownProcessor({
    hastPlugins: [footnotes()]
  });
  const { code } = await processor.render(
    "Texte.[^a]\n\n[^a]: Note avec [lien](https://example.com).\n"
  );

  assert.ok(!code.includes("<sup>"), "footnote markers should not use sup");
  assert.match(code, /class="footnote-ref"/, "footnote marker class");
  assert.match(code, /aria-label="Note 1"/, "footnote marker label");
  assert.match(code, /role="doc-noteref"/, "footnote marker role");
  assert.match(code, /role="doc-endnotes"/, "footnote section role");
  assert.ok(!code.includes("footnote-label"), "footnote heading should be removed");
  assert.ok(!code.includes("Footnotes"), "the default English label should be gone");
  assert.match(code, /aria-label="Retour au texte, note 1"/, "French backlink label");
  assert.match(code, /role="doc-backlink"/, "backlink role");
  assert.match(code, /class="footnote-backref-icon"/, "backlink icon");
  assert.ok(!code.includes("↩"), "the default backlink glyph should be replaced");

  const repeated = await processor.render("A.[^a] B.[^a]\n\n[^a]: Note.\n");
  assert.match(
    repeated.code,
    /aria-label="Retour au texte, note 1-2"/,
    "repeated references keep distinct backlink labels"
  );
}
