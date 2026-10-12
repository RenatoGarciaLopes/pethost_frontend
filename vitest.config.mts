import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest em quatro projetos, um por ambiente/nível (spec 001, REQ-TOOL-001).
 *
 * - `unit`: lógica pura em Node (`*.test.ts`).
 * - `component`: componentes em jsdom (`*.test.tsx`).
 * - `integration`: colaboração entre módulos em Node (`*.int.test.ts`), por exemplo Route Handlers e transporte.
 * - `integration-dom`: hooks/providers com HTTP em jsdom (`*.int.test.tsx`).
 *
 * `passWithNoTests` fica desligado (REQ-TOOL-004): sem teste, a execução falha.
 */
const sharedSetup = ["./src/test/setup/vitest.setup.ts"];
const integrationPattern = "**/*.int.test.{ts,tsx}";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/setup/server-only.stub.ts", import.meta.url)),
    },
  },
  test: {
    passWithNoTests: false,
    // Testes falam com a API em http://api.test, sempre interceptada pelo MSW (nunca rede real).
    env: { BACKEND_URL: "http://api.test", BACKEND_API_PREFIX: "/api/v1" },
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/features/**", "src/shared/**", "src/widgets/**"],
      exclude: [
        "src/shared/api/generated/**",
        "**/*.stories.tsx",
        "**/index.ts",
        "**/index.client.ts",
        "**/index.server.ts",
        "**/*.d.ts",
      ],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
      reporter: ["text", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "plop-templates/**/*.test.ts", "scripts/**/*.test.ts"],
          exclude: [integrationPattern, "node_modules/**"],
          setupFiles: sharedSetup,
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          exclude: [integrationPattern, "node_modules/**"],
          setupFiles: sharedSetup,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          setupFiles: sharedSetup,
        },
      },
      {
        extends: true,
        test: {
          name: "integration-dom",
          environment: "jsdom",
          include: ["src/**/*.int.test.tsx"],
          setupFiles: sharedSetup,
        },
      },
    ],
  },
});
