import assert from "node:assert/strict";
import test from "node:test";
import { hastToHtml, markdownToHast, type HastNode, type HastPluginList } from "satteri";
import { externalLinks } from "../../src/lib/markdown/external-links.ts";
import { footnotes } from "../../src/lib/markdown/footnotes.ts";
import { mermaid } from "../../src/lib/markdown/mermaid.ts";

function render(markdown: string, plugins: HastPluginList) {
  return hastToHtml(markdownToHast(markdown, { hastPlugins: plugins }) as HastNode);
}

test("markdown plugins: external links open in a new tab", () => {
  const html = render(
    "[interne](/articles/) [externe](https://example.com/a) [mail](mailto:contact@alnah.me)",
    [externalLinks()]
  );

  assert.match(html, /<a href="\/articles\/">interne<\/a>/);
  assert.match(html, /<a href="mailto:contact@alnah\.me">mail<\/a>/);
  assert.match(html, /class="external-link"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener"/);
  assert.match(html, /aria-label="externe \(s&#x27;ouvre dans un nouvel onglet\)"/);
  assert.match(html, /class="external-link-icon" aria-hidden="true"/);

  const authored = render(
    '[externe](https://example.com/a){target="_self" rel="nofollow" aria-label="Custom"}',
    [externalLinks()]
  );
  assert.match(authored, /target="_self"/);
  assert.match(authored, /rel="nofollow"/);
  assert.match(authored, /aria-label="Custom"/);

  const twice = render("[externe](https://example.com/a)", [
    externalLinks(),
    externalLinks()
  ]);
  assert.equal(
    twice.match(/class="external-link"/g)?.length,
    1,
    "a marked link is not marked twice"
  );
});

test("markdown plugins: footnotes resolve and announce their backlinks", () => {
  const html = render("Texte[^a] et suite[^b]\n\n[^a]: Une note.\n[^b]: Une autre.", [
    footnotes()
  ]);

  assert.match(html, /data-footnote-ref class="footnote-ref" aria-label="Note 1"/);
  assert.match(html, /data-footnote-ref class="footnote-ref" aria-label="Note 2"/);
  assert.match(html, /href="#user-content-fn-a" id="user-content-fnref-a"/);
  assert.match(html, /id="user-content-fn-a"/);
  assert.match(html, /href="#user-content-fnref-a"/);
  assert.match(html, /aria-label="Retour au texte, note 1"/);
  assert.match(html, /class="footnote-backref-icon"/);
  assert.doesNotMatch(html, /footnote-label|Notes<\/h2>/);
});

test("markdown plugins: mermaid fences become render targets", () => {
  const html = render("```mermaid\nflowchart TD\n  A --> B\n```", [mermaid()]);

  assert.match(html, /<pre class="mermaid">flowchart TD/);
  assert.doesNotMatch(html, /language-mermaid/);

  const code = render("```js\nconst a = 1;\n```", [mermaid()]);
  assert.match(code, /<pre><code class="language-js">/);

  const mixed = render("<pre>text</pre>", [mermaid()]);
  assert.match(mixed, /<pre>text<\/pre>/);
});
