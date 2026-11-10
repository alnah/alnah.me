import assert from "node:assert/strict";
import {
  absoluteUrl,
  buildSeo,
  pageTitle,
  resolveSocialImage
} from "../../src/lib/seo-meta.ts";

/** Page titles, canonical URLs, and social image resolution. */
export function testSeo(): void {
  assert.equal(pageTitle(), "Alexis Nahan");
  assert.equal(pageTitle("Alexis Nahan"), "Alexis Nahan");
  assert.equal(pageTitle("Articles"), "Articles - Alexis Nahan");
  assert.equal(pageTitle("Articles - Alexis Nahan"), "Articles - Alexis Nahan");

  assert.equal(absoluteUrl("/articles/essai/"), "https://alnah.me/articles/essai/");

  assert.equal(resolveSocialImage(undefined), undefined);
  assert.equal(resolveSocialImage("/og-default.jpg"), "https://alnah.me/og-default.jpg");
  assert.equal(resolveSocialImage("https://example.com/a.png"), "https://example.com/a.png");
  assert.equal(
    resolveSocialImage("./cover.jpg", "essai"),
    "https://alnah.me/articles/essai/cover.jpg"
  );

  const seo = buildSeo({
    canonicalPath: "/articles/essai/",
    description: "Description",
    title: "Essai",
    type: "article"
  });

  assert.equal(seo.canonicalUrl, "https://alnah.me/articles/essai/");
  assert.equal(seo.title, "Essai - Alexis Nahan");
  assert.equal(seo.image, "https://alnah.me/og-default.jpg");
  assert.equal(seo.imageWidth, 1200);
  assert.equal(seo.imageHeight, 630);
  assert.equal(seo.twitterCard, "summary_large_image");
  assert.equal(seo.type, "article");

  const customImage = buildSeo({
    canonicalPath: "/",
    description: "Description",
    image: "/custom.png"
  });

  assert.equal(customImage.image, "https://alnah.me/custom.png");
  assert.equal(customImage.imageWidth, undefined);
  assert.equal(customImage.imageHeight, undefined);
}
