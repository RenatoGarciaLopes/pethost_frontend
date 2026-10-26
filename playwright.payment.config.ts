import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Runner focado da 066: reutiliza projetos/configuração e ocupa 5099 somente durante sua vez na fila. */
const servers = Array.isArray(base.webServer) ? base.webServer : base.webServer ? [base.webServer] : [];
export default defineConfig({
  ...base,
  testDir: "e2e",
  use: { ...base.use, baseURL: "http://localhost:3177" },
  projects: base.projects
    ?.filter((project) => project.name?.startsWith("mocked-"))
    .map((project) => ({ ...project, testMatch: "**/e2e/mocked/bookings/payment.spec.ts" })),
  webServer: servers.map((server) =>
    server.url === "http://localhost:3100/login"
      ? {
          ...server,
          command: "node node_modules/next/dist/bin/next dev --webpack -p 3177",
          url: "http://localhost:3177/login",
          reuseExistingServer: false,
          env: {
            ...server.env,
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
          },
        }
      : { ...server, reuseExistingServer: false },
  ),
});
