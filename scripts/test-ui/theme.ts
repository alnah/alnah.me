import assert from "node:assert/strict";
import type { Browser } from "playwright";

/** Theme toggle: mode cycle, shortcut, label, and persistence. */
export async function testTheme(browser: Browser, origin: string): Promise<void> {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  const toggle = page.locator("[data-theme-toggle]");
  const label = page.locator("[data-theme-toggle-label]");
  const mode = () => page.evaluate(() => document.documentElement.dataset.themeMode);

  await page.goto(`${origin}/`);

  assert.equal(await mode(), "system", "the default mode follows the system");
  assert.equal((await label.textContent())?.trim(), "Auto", "the default label is Auto");

  await toggle.click();
  assert.equal(await mode(), "dark", "system cycles to dark");
  assert.equal((await label.textContent())?.trim(), "Sombre", "the label follows the mode");

  await toggle.click();
  assert.equal(await mode(), "light", "dark cycles to light");

  await toggle.click();
  assert.equal(await mode(), "system", "light cycles back to system");

  await page.keyboard.press("Shift+T");
  assert.equal(await mode(), "dark", "shift+t toggles the theme");

  await page.reload();
  assert.equal(await mode(), "dark", "the mode persists after reload");
  assert.equal((await label.textContent())?.trim(), "Sombre", "the label persists after reload");

  await context.close();
}
