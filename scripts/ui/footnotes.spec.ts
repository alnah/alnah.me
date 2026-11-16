import { expect, test } from "@playwright/test";
import { findPostPath } from "./helpers.ts";

/** Footnote navigation and the visible return labels. */
const postPath = findPostPath((html) => html.includes("data-footnote-ref"));

test.skip(!postPath, "no built post with footnotes");

test("footnote marker and backlink navigate", async ({ page }) => {
  await page.goto(postPath as string);

  const marker = page.locator(".footnote-ref").first();
  await expect(marker).toHaveAttribute("aria-label", /^Note \d+$/);

  const noteId = ((await marker.getAttribute("href")) ?? "").slice(1);
  expect(noteId, "the footnote marker targets a note").not.toBe("");

  await marker.click();
  await expect(page).toHaveURL(new RegExp(`#${noteId}$`));
  await expect(page.locator(".footnotes li:target")).toBeVisible();

  const backlink = page.locator(".footnotes li:target .footnote-backref").first();
  await expect(backlink).toHaveAttribute("aria-label", /^Retour au texte, note \d+$/);

  const refId = ((await backlink.getAttribute("href")) ?? "").slice(1);
  expect(refId, "the backlink targets a footnote reference").not.toBe("");

  await backlink.click();
  await expect(page).toHaveURL(new RegExp(`#${refId}$`));
});
