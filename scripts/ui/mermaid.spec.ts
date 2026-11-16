import { expect, test } from "@playwright/test";
import { findPostPath } from "./helpers.ts";

/** Diagram dialog: opening, zooming, exporting, and closing. */
const postPath = findPostPath((html) => html.includes('class="mermaid"'));

test.use({
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"]
});

test.skip(!postPath, "no built post with a diagram");

test("diagram dialog zooms, copies, downloads, and closes", async ({ page }) => {
  await page.goto(postPath as string);

  const expand = page.locator(".mermaid-expand").first();
  await expand.waitFor({ state: "visible" });
  await expand.click();

  const dialog = page.locator("dialog.mermaid-dialog");
  await expect(dialog).toBeVisible();
  await page.waitForSelector('dialog.mermaid-dialog[data-ready="true"]');

  const scale = dialog.locator(".mermaid-dialog__scale");
  const initialScale = (await scale.textContent()) ?? "";
  await dialog.locator('[data-mermaid-action="zoom-in"]').click();
  await expect(scale).not.toHaveText(initialScale);

  await page.bringToFront();
  await dialog.locator('[data-mermaid-action="copy"]').click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard, "the copied source keeps the mermaid fence").toContain("```mermaid");
  expect(clipboard, "the copied source carries the attribution").toContain("Licence");

  const downloadPromise = page.waitForEvent("download");
  await dialog.locator('[data-mermaid-action="download"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename(), "the download is an SVG").toMatch(/\.svg$/);

  await dialog.locator('[data-mermaid-action="close"]').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".mermaid-figure svg").first()).toBeVisible();
});
