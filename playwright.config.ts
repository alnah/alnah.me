import { defineConfig, devices } from "@playwright/test";

const origin = `http://127.0.0.1:${process.env.UI_PORT ?? "4399"}`;

export default defineConfig({
  testDir: "scripts/ui",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: origin,
    colorScheme: "dark",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /responsive\.spec\.ts/
    },
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE"] },
      testMatch: /responsive\.spec\.ts/
    },
    {
      name: "ipad-mini",
      use: { ...devices["iPad Mini"] },
      testMatch: /responsive\.spec\.ts/
    }
  ],
  webServer: {
    command: "node scripts/ui/server.ts",
    url: `${origin}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
