import assert from "node:assert/strict";
import type { Browser } from "playwright";
import { findPostPath } from "./helpers.ts";

/** Footnote navigation and the visible return labels. */
export async function testFootnotes(browser: Browser, origin: string): Promise<void> {
  const postPath = findPostPath((html) => html.includes("data-footnote-ref"));

  if (!postPath) {
    return;
  }

  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto(`${origin}${postPath}`);

  const marker = page.locator(".footnote-ref").first();
  assert.match((await marker.getAttribute("aria-label")) ?? "", /^Note \d+$/);

  const noteId = ((await marker.getAttribute("href")) ?? "").slice(1);
  assert.ok(noteId, "the footnote marker targets a note");

  await marker.click();
  await page.waitForFunction((id) => location.hash === `#${id}`, noteId);
  assert.ok(
    await page.locator(".footnotes li:target").isVisible(),
    "clicking a marker should target its note"
  );

  const backlink = page.locator(".footnotes li:target .footnote-backref").first();
  assert.match(
    (await backlink.getAttribute("aria-label")) ?? "",
    /^Retour au texte, note \d+$/
  );

  const refId = ((await backlink.getAttribute("href")) ?? "").slice(1);
  assert.ok(refId, "the backlink targets a footnote reference");

  await backlink.click();
  await page.waitForFunction((id) => location.hash === `#${id}`, refId);

  await context.close();
}
