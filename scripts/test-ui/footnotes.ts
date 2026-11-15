import assert from "node:assert/strict";
import type { Browser } from "playwright";

const POST_PATH = "/articles/perspective-actionnelle/";

/** Footnote navigation and the visible return labels. */
export async function testFootnotes(browser: Browser, origin: string): Promise<void> {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto(`${origin}${POST_PATH}`);

  const marker = page.locator(".footnote-ref").first();
  assert.equal(await marker.getAttribute("aria-label"), "Note 1");

  await marker.click();
  await page.waitForFunction(() => location.hash === "#user-content-fn-cecrl");
  assert.ok(
    await page.locator(".footnotes li:target").isVisible(),
    "clicking a marker should target its note"
  );

  const backlink = page.locator(".footnotes li:target .footnote-backref").first();
  assert.equal(await backlink.getAttribute("aria-label"), "Retour au texte, note 1");

  await backlink.click();
  await page.waitForFunction(() => location.hash === "#user-content-fnref-cecrl");

  await context.close();
}
