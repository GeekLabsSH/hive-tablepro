import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra o Storybook (browser real). Complementa Vitest/jsdom.
 *
 * Arranque: `npm run test:e2e:storybook` (sobe Storybook em :6006 se necessário).
 */
export default defineConfig({
  testDir: "./e2e/storybook",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:6006",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"]
  },
  webServer: {
    command: "npx storybook dev -p 6006 --ci --no-open",
    url: "http://127.0.0.1:6006",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
