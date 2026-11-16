import { expect, test } from "@playwright/test";
import { slugify } from "../../src/lib/content/format.ts";
import { assertNoHorizontalOverflow, targetPost } from "./helpers.ts";

/** Mobile and tablet layouts must not scroll horizontally. */
test("pages never overflow horizontally", async ({ page }, testInfo) => {
  const post = targetPost();
  const routes = ["/", "/a-propos/", "/articles/", "/categories/"];

  if (post) {
    routes.push(post.url);

    const tagSlug = post.tags?.[0] ? slugify(post.tags[0]) : "";
    if (tagSlug) {
      routes.push(`/etiquettes/${tagSlug}/`);
    }
  }

  for (const route of routes) {
    await page.goto(route);

    if (route === "/") {
      await page.getByRole("button", { name: /ouvrir la recherche/i }).click();
    }

    await assertNoHorizontalOverflow(page, `${testInfo.project.name} ${route}`);
  }

  await expect(page.locator("body")).toBeVisible();
});
