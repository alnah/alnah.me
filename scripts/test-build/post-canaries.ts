import assert from "node:assert/strict";
import { attr, byTag, elements, normalizeText, textContent } from "../page-dom.ts";
import type { BuiltSite } from "./built-site.ts";

/** Canaries: title, body, and footnote references resolve on every post. */
export function checkPostCanaries({ posts }: BuiltSite): void {
  // Canaries: every published post must render its title and a real body, and
  // every footnote reference must resolve to a note in the same page.
  for (const { post, dom } of posts) {
    const h1 = byTag(dom, "h1")[0];
    assert.ok(h1, `${post.slug} renders an H1`);
    assert.equal(normalizeText(textContent(h1)), normalizeText(post.title), `${post.slug} renders its title`);

    const article = byTag(dom, "article")[0];
    assert.ok(article, `${post.slug} renders an article`);
    assert.ok(
      normalizeText(textContent(article)).split(" ").filter(Boolean).length >= 100,
      `${post.slug} renders a non-empty body`
    );

    const notes = elements(dom, (element) => attr(element, "data-footnotes") !== undefined)[0];
    const noteIds = new Set(
      notes
        ? elements(notes, (element) => attr(element, "id") !== undefined).map((element) => attr(element, "id"))
        : []
    );
    const refs = elements(dom, (element) => attr(element, "data-footnote-ref") !== undefined);

    if (notes) {
      assert.ok(refs.length > 0, `${post.slug} renders footnote references`);

      for (const ref of refs) {
        const target = (attr(ref, "href") ?? "").replace(/^#/, "");
        assert.ok(noteIds.has(target), `${post.slug} footnote reference resolves`);
      }

      for (const backref of elements(notes, (element) => attr(element, "data-footnote-backref") !== undefined)) {
        const target = (attr(backref, "href") ?? "").replace(/^#/, "");
        assert.ok(
          elements(dom, (element) => attr(element, "id") === target).length > 0,
          `${post.slug} footnote backlink resolves`
        );
      }
    } else {
      assert.equal(refs.length, 0, `${post.slug} renders no dangling footnote reference`);
    }
  }
}
