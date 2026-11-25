import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "./config/envLoader.js";

loadEnv("local");

// Load configuration after environment variables have been loaded.
const { default: config } = await import("./config/globalConfig.js");

export default defineConfig({
  testDir: "./tests",
  timeout: config.timeout,
  expect: {
    timeout: config.expectTimeout
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["allure-playwright"]
  ],

  use: {
    baseURL: config.baseURL,
    headless: config.headless,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure"
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],

  ...(config.startWebServer
    ? {
        webServer: {
          command: "npm run dev",
          url: config.baseURL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI
        }
      }
    : {})
});