import { expect, test } from "@playwright/test";

/** Theme toggle: mode cycle, shortcut, label, and persistence. */
test("theme cycles, persists, and exposes its label", async ({ page }) => {
  const toggle = page.locator("[data-theme-toggle]");
  const label = page.locator("[data-theme-toggle-label]");
  const mode = () =>
    page.evaluate(() => document.documentElement.dataset.themeMode);

  await page.goto("/");

  await expect.poll(mode).toBe("system");
  await expect(label).toHaveText("Auto");

  await toggle.click();
  await expect.poll(mode).toBe("dark");
  await expect(label).toHaveText("Sombre");

  await toggle.click();
  await expect.poll(mode).toBe("light");

  await toggle.click();
  await expect.poll(mode).toBe("system");

  await page.keyboard.press("Shift+T");
  await expect.poll(mode).toBe("dark");

  await page.reload();
  await expect.poll(mode).toBe("dark");
  await expect(label).toHaveText("Sombre");
});
