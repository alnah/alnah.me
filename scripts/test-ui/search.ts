import assert from "node:assert/strict";
import type { Browser } from "playwright";
import { firstUsefulToken, targetPost } from "./helpers.ts";

/** Search dialog: shortcuts, keyboard navigation, and closing behaviour. */
export async function testSearch(browser: Browser, origin: string): Promise<void> {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  const trigger = page.getByRole("button", { name: /ouvrir la recherche/i });
  const input = page.locator("[data-search-input]");

  await page.goto(`${origin}/`);

  // The "/" shortcut opens the search and focuses the input.
  await page.keyboard.press("/");
  await input.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.activeElement?.matches("[data-search-input]"));

  // Escape closes it and returns the focus to the trigger.
  await page.keyboard.press("Escape");
  await input.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.matches("[data-search-trigger]"));

  // A query without a match shows the empty status.
  await trigger.click();
  await input.fill("zzzzzz");
  const status = page.locator("[data-search-status]");
  await status.waitFor({ state: "visible" });
  assert.match((await status.textContent()) ?? "", /Aucun article/, "an empty search explains itself");

  const post = targetPost();

  if (post) {
    // A real query renders results; arrows move the active option, Enter follows it.
    await input.fill(firstUsefulToken(post.title));
    const firstLink = page.locator("[data-search-results] a").first();
    await firstLink.waitFor({ state: "visible" });
    await input.press("ArrowDown");
    assert.equal(
      await input.getAttribute("aria-activedescendant"),
      await firstLink.getAttribute("id"),
      "arrow down points the combobox at the first result"
    );
    assert.equal(
      await firstLink.evaluate((element) => element.classList.contains("is-active")),
      true,
      "arrow down marks the first result active"
    );
    await Promise.all([page.waitForURL(`${origin}${post.url}`), input.press("Enter")]);
  } else {
    await input.press("Escape");
  }

  // A click outside the dialog closes it.
  await page.goto(`${origin}/`);
  await trigger.click();
  await input.waitFor({ state: "visible" });
  await page.evaluate(() => {
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await input.waitFor({ state: "hidden" });

  await context.close();
}
