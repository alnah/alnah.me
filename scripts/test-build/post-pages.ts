import assert from "node:assert/strict";
import { SITE } from "../../src/config/site.ts";
import { formatDate, formatIsoDate } from "../../src/lib/content/format.ts";
import { absoluteUrl } from "../build-expectations.ts";
import {
  anchorHrefs,
  attr,
  byTag,
  jsonLd,
  metaContent,
  normalizeText,
  textContent,
  type PageDocument
} from "../page-dom.ts";
import { assertIncludes } from "../test-helpers.ts";
import type { BuiltSite } from "./built-site.ts";

function anchorFor(doc: PageDocument, href: string) {
  return byTag(doc, "a").find((anchor) => attr(anchor, "href") === href);
}

/** Per-post metadata, canonical URL, sharing block, and social image. */
export function checkPostPages({ posts, searchIndex }: BuiltSite): void {
  for (const { post, raw, dom } of posts) {
    const canonical = byTag(dom, "link").find((link) => attr(link, "rel") === "canonical");
    assert.ok(canonical, `${post.slug} canonical link`);
    assert.equal(attr(canonical, "href"), absoluteUrl(post.url), `${post.slug} canonical link`);
    assert.equal(metaContent(dom, "property", "og:type"), "article", `${post.slug} og:type`);
    assert.match(metaContent(dom, "name", "twitter:card") ?? "", /^summary/, `${post.slug} twitter card`);
    assert.match(normalizeText(textContent(dom)), /\d+ min de lecture/, `${post.slug} reading time`);
    assert.ok(anchorFor(dom, "/articles/"), `${post.slug} all posts link`);
    assert.match(normalizeText(textContent(dom)), /Partager cet article sur/, `${post.slug} share block`);
    assert.ok(anchorHrefs(dom).includes(post.rawPath), `${post.slug} raw reuse link`);

    for (const platform of [
      "twitter.com/intent/tweet",
      "linkedin.com/sharing/share-offsite",
      "wa.me/?text=",
      "facebook.com/sharer/sharer.php",
      "t.me/share/url",
      "mailto:"
    ]) {
      assert.ok(
        anchorHrefs(dom).some((href) => href.includes(platform)),
        `${post.slug} share link ${platform}`
      );
    }

    assert.ok(!raw.startsWith("---"), `${post.slug} raw export has no frontmatter`);
    assert.ok(!raw.includes("\ntitle:"), `${post.slug} raw export has no frontmatter fields`);
    assert.ok(raw.startsWith(`# ${post.title}`), `${post.slug} raw export starts with its title`);
    assertIncludes(raw, `© ${new Date().getFullYear()} [${SITE.author.name}](${absoluteUrl(SITE.aboutPath)})`, `${post.slug} raw copyright`);
    assertIncludes(raw, `[${SITE.license.name}](${SITE.license.url})`, `${post.slug} raw license`);

    const pageText = normalizeText(textContent(dom));
    assert.match(
      pageText,
      new RegExp(`Publié le ${formatDate(post.publicationDate)}`),
      `${post.slug} publication label`
    );
    assert.ok(
      byTag(dom, "time").some(
        (element) => attr(element, "datetime") === formatIsoDate(post.publicationDate)
      ),
      `${post.slug} publication datetime`
    );

    if (post.isUpdated) {
      const isoDate = formatIsoDate(post.displayDate);
      const time = byTag(dom, "time").find((element) => attr(element, "datetime") === isoDate);
      assert.ok(time, `${post.slug} updated datetime`);
      assert.match(
        pageText,
        new RegExp(`Mis à jour le ${formatDate(post.displayDate)}`),
        `${post.slug} updated label`
      );
    }

    const postSchema = jsonLd(dom)[0] as {
      "@type"?: string;
      "@id"?: string;
      inLanguage?: string;
      image?: string;
      author?: {
        "@id"?: string;
        jobTitle?: string;
        knowsAbout?: string[];
        sameAs?: string[];
      };
      isPartOf?: { "@id"?: string; name?: string };
      license?: string;
      copyrightYear?: number;
      copyrightHolder?: { "@id"?: string };
    };
    assert.equal(postSchema["@type"], "BlogPosting", `${post.slug} BlogPosting schema`);
    assert.equal(postSchema["@id"], absoluteUrl(`${post.url}#article`), `${post.slug} schema id`);
    assert.equal(postSchema.image, absoluteUrl(post.socialImagePath), `${post.slug} schema image`);
    assert.equal(postSchema.inLanguage, "fr-FR", `${post.slug} schema language`);
    assert.equal(postSchema.author?.["@id"], absoluteUrl("/#person"), `${post.slug} author id`);
    assert.equal(postSchema.author?.jobTitle, SITE.author.jobTitle, `${post.slug} author job title`);
    assert.deepEqual(postSchema.author?.knowsAbout, SITE.author.knowsAbout, `${post.slug} author topics`);
    assert.equal(postSchema.isPartOf?.["@id"], absoluteUrl("/#blog"), `${post.slug} isPartOf blog`);
    assert.equal(postSchema.isPartOf?.name, SITE.title, `${post.slug} blog name`);
    assert.equal(postSchema.license, SITE.license.url, `${post.slug} license`);
    assert.equal(postSchema.copyrightYear, new Date().getFullYear(), `${post.slug} copyright year`);
    assert.equal(
      postSchema.copyrightHolder?.["@id"],
      absoluteUrl("/#person"),
      `${post.slug} copyright holder`
    );

    const searchItem = searchIndex.find((entry) => entry.url === post.url);
    assert.ok(searchItem, `${post.slug} search entry`);
    assert.equal(
      searchItem?.updated,
      post.isUpdated ? formatIsoDate(post.lastmod) : undefined,
      `${post.slug} search updated date`
    );
    assert.equal(
      searchItem?.updatedLabel,
      post.isUpdated ? `Mis à jour le ${formatDate(post.lastmod)}` : undefined,
      `${post.slug} search updated label`
    );
  }
}
