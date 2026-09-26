import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
