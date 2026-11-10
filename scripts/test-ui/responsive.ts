import { devices, type Browser } from "playwright";
import { slugify } from "../../src/lib/content/format.ts";
import { assertNoHorizontalOverflow, targetPost } from "./helpers.ts";

/** Mobile and tablet layouts must not scroll horizontally. */
export async function testResponsive(browser: Browser, origin: string): Promise<void> {
  const post = targetPost();
  const routes = ["/", "/a-propos/", "/articles/", "/categories/"];

  if (post) {
    routes.push(post.url);

    const tagSlug = post.tags?.[0] ? slugify(post.tags[0]) : "";
    if (tagSlug) {
      routes.push(`/etiquettes/${tagSlug}/`);
    }
  }

  for (const deviceName of ["iPhone SE", "iPad Mini"]) {
    const context = await browser.newContext({
      ...devices[deviceName],
      colorScheme: "dark"
    });
    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(`${origin}${route}`);

      if (route === "/") {
        await page.getByRole("button", { name: /ouvrir la recherche/i }).click();
      }

      await assertNoHorizontalOverflow(page, `${deviceName} ${route}`);
    }

    await context.close();
  }
}
