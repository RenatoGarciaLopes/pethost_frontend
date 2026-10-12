/**
 * REQ-TOOL-010: mocked projects use the local MSW backend.
 * For real-desktop, set E2E_REAL=1 and BACKEND_URL from the environment
 * (or E2E_BACKEND_URL); never fall back to the simulated API in real mode.
 */
import { defineConfig, devices } from "@playwright/test";

const isReal =
  process.env.E2E_REAL === "1" ||
  process.argv.some((argument) => argument === "--project=real-desktop" || argument === "real-desktop");
const backendUrl = process.env.E2E_BACKEND_URL ?? process.env.BACKEND_URL;
if (isReal && !backendUrl) {
  throw new Error("real-desktop requires BACKEND_URL or E2E_BACKEND_URL");
}

/** Browser projects and managed local servers; real mode requires a running .NET API. */
const config = defineConfig({
  testDir: "e2e",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "mocked-desktop", testMatch: "**/e2e/mocked/**/*.spec.ts", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mocked-mobile",
      testMatch: "**/e2e/mocked/**/*.spec.ts",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    { name: "real-desktop", testMatch: "**/e2e/real/**/*.spec.ts", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    ...(!isReal
      ? [
          {
            command: "node e2e/support/mock-backend.mjs",
            url: "http://localhost:5099/health",
            reuseExistingServer: !process.env.CI,
          },
        ]
      : []),
    {
      command: "node node_modules/next/dist/bin/next dev -p 3100",
      // Pronto quando a tela de entrar responde (a home chega na spec 040).
      url: "http://localhost:3100/login",
      env: {
        BACKEND_URL: isReal ? backendUrl! : "http://localhost:5099",
        BACKEND_API_PREFIX: process.env.E2E_BACKEND_API_PREFIX ?? "/api/v1",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});

export default config;
