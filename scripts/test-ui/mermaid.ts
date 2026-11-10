import assert from "node:assert/strict";
import type { Browser } from "playwright";

const DIAGRAM_POST_PATH = "/articles/perspective-actionnelle/";

/** Diagram dialog: opening, zooming, exporting, and closing. */
export async function testMermaid(browser: Browser, origin: string): Promise<void> {
  const context = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();

  await page.goto(`${origin}${DIAGRAM_POST_PATH}`);

  const expand = page.locator(".mermaid-expand").first();
  await expand.waitFor({ state: "visible" });
  await expand.click();

  const dialog = page.locator("dialog.mermaid-dialog");
  await dialog.waitFor({ state: "visible" });
  await page.waitForSelector('dialog.mermaid-dialog[data-ready="true"]');
  assert.equal(
    await dialog.evaluate((element: HTMLDialogElement) => element.open),
    true,
    "the dialog is open"
  );

  const scale = dialog.locator(".mermaid-dialog__scale");
  const initialScale = (await scale.textContent()) ?? "";
  await dialog.locator('[data-mermaid-action="zoom-in"]').click();
  await page.waitForFunction((previous) => {
    const output = document.querySelector(".mermaid-dialog__scale");
    return output !== null && output.textContent !== previous;
  }, initialScale);
  assert.notEqual((await scale.textContent()) ?? "", initialScale, "zoom in changes the scale");

  // Copy keeps the mermaid fence and the attribution comment.
  await page.bringToFront();
  await dialog.locator('[data-mermaid-action="copy"]').click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(clipboard.includes("```mermaid"), "the copied source keeps the mermaid fence");
  assert.ok(clipboard.includes("Licence"), "the copied source carries the attribution");

  // Download produces an SVG file.
  const downloadPromise = page.waitForEvent("download");
  await dialog.locator('[data-mermaid-action="download"]').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /\.svg$/, "the download is an SVG");

  // Closing restores the diagram in its figure.
  await dialog.locator('[data-mermaid-action="close"]').click();
  await dialog.waitFor({ state: "hidden" });
  assert.ok(
    (await page.locator(".mermaid-figure svg").count()) > 0,
    "the diagram returns to its figure"
  );

  await context.close();
}
