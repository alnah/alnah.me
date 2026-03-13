import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium, devices } from "playwright";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

function resolveDistAsset(pathname) {
  const decodedPath = decodeURIComponent(pathname.split("?")[0] || "/");
  const safePath = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, "");

  if (safePath === "/" || safePath === ".") {
    return path.join(distDir, "index.html");
  }

  const requestedPath = path.join(distDir, safePath.replace(/^\//, ""));

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  if (!path.extname(requestedPath)) {
    return path.join(requestedPath, "index.html");
  }

  return requestedPath;
}

async function startStaticServer() {
  const server = http.createServer((request, response) => {
    const assetPath = resolveDistAsset(request.url || "/");

    if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }

    response.setHeader(
      "Content-Type",
      MIME_TYPES.get(path.extname(assetPath)) || "application/octet-stream"
    );
    fs.createReadStream(assetPath).pipe(response);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not bind the local UI test server");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve(undefined)));
      });
    }
  };
}

function firstUsefulToken(title) {
  return (
    title
      .split(/\s+/)
      .map((token) => token.replace(/[^A-Za-z0-9]/g, ""))
      .find((token) => token.length >= 4) || title
  );
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth - doc.clientWidth, document.body.scrollWidth - window.innerWidth);
  });

  assert.ok(overflow <= 1, `${label} should not overflow horizontally (got ${overflow}px)`);
}

const searchIndex = JSON.parse(fs.readFileSync(path.join(distDir, "index.json"), "utf8"));
const targetPost = searchIndex.find((item) => item?.title && item?.url);
const server = await startStaticServer();
const browser = await chromium.launch();

try {
  const desktopContext = await browser.newContext({ colorScheme: "dark" });
  const desktopPage = await desktopContext.newPage();

  await desktopPage.goto(`${server.origin}/`);
  await desktopPage.getByRole("button", { name: /toggle search/i }).click();

  if (targetPost) {
    const searchQuery = firstUsefulToken(targetPost.title);
    await desktopPage.locator("#search-input").fill(searchQuery);
    await desktopPage.locator("[data-search-results] a").first().waitFor({ state: "visible" });
    await desktopPage.locator("#search-input").press("ArrowDown");
    await Promise.all([
      desktopPage.waitForURL(`${server.origin}${targetPost.url}`),
      desktopPage.locator("#search-input").press("Enter")
    ]);
  } else {
    await desktopPage.locator("#search-input").fill("hello");
    await desktopPage.locator("[data-search-status]").waitFor({ state: "visible" });
  }

  await desktopPage.goto(`${server.origin}/`);
  const themeBefore = await desktopPage.evaluate(() => document.documentElement.dataset.themeMode);
  await desktopPage.locator("[data-theme-toggle]").click();
  const themeAfter = await desktopPage.evaluate(() => document.documentElement.dataset.themeMode);
  assert.notEqual(themeAfter, themeBefore, "theme toggle should change the theme mode");
  await desktopPage.reload();
  const persistedTheme = await desktopPage.evaluate(() => document.documentElement.dataset.themeMode);
  assert.equal(persistedTheme, themeAfter, "theme toggle should persist after reload");
  await desktopContext.close();

  for (const deviceName of ["iPhone SE", "iPad Mini"]) {
    const context = await browser.newContext({
      ...devices[deviceName],
      colorScheme: "dark"
    });
    const page = await context.newPage();

    const routes = ["/", "/about/", "/posts/"];
    if (targetPost) {
      routes.push(targetPost.url);
    }

    for (const route of routes) {
      await page.goto(`${server.origin}${route}`);

      if (route === "/") {
        await page.getByRole("button", { name: /toggle search/i }).click();
      }

      await assertNoHorizontalOverflow(page, `${deviceName} ${route}`);
    }

    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

console.log("test:ui passed");
