import { chromium } from "playwright";
import { testMermaid } from "./test-ui/mermaid.ts";
import { testResponsive } from "./test-ui/responsive.ts";
import { testSearch } from "./test-ui/search.ts";
import { startStaticServer } from "./test-ui/server.ts";
import { testTheme } from "./test-ui/theme.ts";

const server = await startStaticServer();
const browser = await chromium.launch();

try {
  await testSearch(browser, server.origin);
  await testTheme(browser, server.origin);
  await testMermaid(browser, server.origin);
  await testResponsive(browser, server.origin);
} finally {
  await browser.close();
  await server.close();
}

console.log("test:ui passed");
