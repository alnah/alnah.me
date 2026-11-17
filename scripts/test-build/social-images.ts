import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  EXPECTED_SOCIAL_IMAGES,
  absoluteUrl,
  expectedSitemapPaths
} from "../build-expectations.ts";
import { metaContent, parsePage } from "../page-dom.ts";
import { readFile, readPngDimensions } from "../test-helpers.ts";

function pageFile(pagePath: string) {
  return pagePath === "/" ? "dist/index.html" : `dist${pagePath}index.html`;
}

function filesUnder(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

/** Generated cards, meta wiring, and dimensions for every indexable page. */
export function checkSocialImages(): void {
  const actualImages = filesUnder("dist/og")
    .map((file) => `/${path.relative("dist", file).split(path.sep).join("/")}`)
    .sort();

  assert.deepEqual(
    actualImages,
    EXPECTED_SOCIAL_IMAGES.map(({ imagePath }) => imagePath).sort(),
    "social images match the indexable pages"
  );

  const sitemapPaths = expectedSitemapPaths();

  for (const { pagePath, imagePath } of EXPECTED_SOCIAL_IMAGES) {
    assert.ok(
      sitemapPaths.has(pagePath),
      `${pagePath} must be indexable when it owns a social image`
    );

    const dom = parsePage(readFile(pageFile(pagePath)));
    const image = absoluteUrl(imagePath);
    const alt = metaContent(dom, "property", "og:image:alt");

    assert.equal(metaContent(dom, "property", "og:image"), image, `${pagePath} og:image`);
    assert.equal(metaContent(dom, "property", "og:image:width"), "1200", `${pagePath} og:image width`);
    assert.equal(metaContent(dom, "property", "og:image:height"), "630", `${pagePath} og:image height`);
    assert.match(alt ?? "", /^Image de partage pour .+\.$/, `${pagePath} og:image:alt`);
    assert.equal(metaContent(dom, "name", "twitter:image"), image, `${pagePath} twitter:image`);
    assert.equal(metaContent(dom, "name", "twitter:image:alt"), alt, `${pagePath} twitter:image:alt`);

    const dimensions = readPngDimensions(`dist${imagePath}`);
    assert.equal(dimensions.width, 1200, `${pagePath} image width`);
    assert.equal(dimensions.height, 630, `${pagePath} image height`);
  }
}
