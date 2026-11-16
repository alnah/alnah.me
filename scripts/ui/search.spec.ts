import { expect, test } from "@playwright/test";
import { firstUsefulToken, targetPost } from "./helpers.ts";

/** Search dialog: shortcuts, keyboard navigation, and closing behaviour. */
test("search opens, ranks, navigates, and closes", async ({ page }) => {
  const trigger = page.getByRole("button", { name: /ouvrir la recherche/i });
  const input = page.locator("[data-search-input]");

  await page.goto("/");

  await page.keyboard.press("/");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(input).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await input.fill("zzzzzz");
  await expect(page.locator("[data-search-status]")).toContainText("Aucun article");

  const post = targetPost();

  if (post) {
    await input.fill(firstUsefulToken(post.title));
    const firstLink = page.locator("[data-search-results] a").first();
    await expect(firstLink).toBeVisible();
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      (await firstLink.getAttribute("id")) ?? ""
    );
    await expect(firstLink).toHaveClass(/is-active/);
    await Promise.all([page.waitForURL(`**${post.url}`), input.press("Enter")]);
  } else {
    await input.press("Escape");
  }

  await page.goto("/");
  await trigger.click();
  await expect(input).toBeVisible();
  await page.evaluate(() => {
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(input).toBeHidden();
});
