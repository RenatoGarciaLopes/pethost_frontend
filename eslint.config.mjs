import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import boundaries from "eslint-plugin-boundaries";
import noNumericRadius from "./scripts/eslint/no-numeric-radius.mjs";

/**
 * Lint do frontend PetHost.
 *
 * Fronteiras de arquitetura (spec 001, REQ-TOOL-006 e REQ-TOOL-007) viram erro de lint:
 * - feature não importa outra feature; widget não importa outro widget;
 * - shared não importa nada acima dele; bootstrap só usa shared;
 * - código de cliente não importa código de servidor;
 * - fora da slice, só se importa pelos arquivos `index*`.
 * Testadas em `src/test/architecture/boundaries.test.ts`.
 */

/** Arquivos de cliente por convenção (docs/conventions.md §2): não podem importar código de servidor. */
const clientFiles = [
  "src/**/components/client/**/*.{ts,tsx}",
  "src/**/hooks/**/*.{ts,tsx}",
  "src/**/stores/**/*.{ts,tsx}",
  "src/**/*.client.{ts,tsx}",
  "src/test/architecture/fixtures/**/components/client/**/*.{ts,tsx}",
];

/** Arquivos em que o Next (ou a ferramenta) exige `export default`. */
const defaultExportAllowed = [
  "src/app/**/{page,layout,template,loading,error,global-error,not-found,default,route,opengraph-image,icon}.tsx",
  "src/app/**/{route,sitemap,robots,manifest}.ts",
  "src/proxy.ts",
  "**/*.stories.tsx",
  "*.config.{ts,mjs,js}",
  ".storybook/**",
  "plopfile.mjs",
];

const sliceEntryMessage =
  "Importe a slice só pela API pública (index.ts, index.client.ts ou index.server.ts). Ver docs/conventions.md §2.";

/**
 * Quem pode importar quem (spec 001, REQ-TOOL-006). Reaproveitado no bloco dos arquivos de teste,
 * que acrescenta só a permissão de importar `src/test`.
 */
const layerPolicies = [
  {
    from: { element: { type: "app" } },
    allow: { to: { element: { types: { anyOf: ["app", "bootstrap", "widget", "feature", "shared"] } } } },
  },
  {
    from: { element: { type: "bootstrap" } },
    allow: { to: { element: { types: { anyOf: ["bootstrap", "shared"] } } } },
  },
  {
    from: { element: { type: "widget" } },
    allow: { to: { element: { types: { anyOf: ["feature", "shared"] } } } },
  },
  {
    from: { element: { type: "widget" } },
    allow: {
      to: { element: { type: "widget", captured: { widget: "{{ from.element.captured.widget }}" } } },
    },
  },
  {
    from: { element: { type: "feature" } },
    allow: { to: { element: { types: { anyOf: ["shared", "generated"] } } } },
  },
  {
    from: { element: { type: "feature" } },
    allow: {
      to: { element: { type: "feature", captured: { feature: "{{ from.element.captured.feature }}" } } },
    },
  },
  {
    from: { element: { type: "shared" } },
    allow: { to: { element: { types: { anyOf: ["shared", "generated"] } } } },
  },
  {
    from: { element: { type: "generated" } },
    allow: { to: { element: { type: "generated" } } },
  },
  {
    from: { element: { type: "test" } },
    allow: {
      to: {
        element: {
          types: { anyOf: ["app", "bootstrap", "widget", "feature", "shared", "generated", "test"] },
        },
      },
    },
  },
];

const nonTestTypes = ["app", "bootstrap", "widget", "feature", "shared", "generated"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "storybook-static/**",
    "next-env.d.ts",
    "src/shared/api/generated/**",
    "src/test/architecture/fixtures/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries, pethost: noNumericRadius },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/include": ["src/**/*"],
      // A ordem importa: o primeiro padrão que casar classifica o arquivo.
      "boundaries/elements": [
        { type: "generated", pattern: "shared/api/generated" },
        { type: "feature", pattern: "features/*", capture: ["feature"] },
        { type: "widget", pattern: "widgets/*", capture: ["widget"] },
        { type: "bootstrap", pattern: "bootstrap" },
        { type: "shared", pattern: "shared" },
        { type: "app", pattern: "app" },
        { type: "test", pattern: "test" },
      ],
    },
    rules: {
      "pethost/no-numeric-radius": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: layerPolicies,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/*",
                "!@/features/*/index",
                "!@/features/*/index.client",
                "!@/features/*/index.server",
              ],
              message: sliceEntryMessage,
            },
            {
              group: ["@/widgets/*/*", "!@/widgets/*/index", "!@/widgets/*/index.client", "!@/widgets/*/index.server"],
              message: sliceEntryMessage,
            },
          ],
        },
      ],
      "import/no-default-export": "error",
    },
  },
  {
    // Testes e stories seguem as mesmas fronteiras e ainda podem usar a infraestrutura de `src/test`.
    files: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.tsx"],
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            ...layerPolicies,
            {
              from: { element: { types: { anyOf: nonTestTypes } } },
              allow: { to: { element: { type: "test" } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: clientFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "server-only", message: "Código de cliente não pode importar server-only." }],
          patterns: [
            {
              group: ["**/api/server", "**/api/server/**", "**/*.server", "**/index.server"],
              message: "Código de cliente não pode importar código de servidor (api/server, *.server, index.server).",
            },
            {
              group: ["@/features/*/*", "!@/features/*/index", "!@/features/*/index.client"],
              message: sliceEntryMessage,
            },
          ],
        },
      ],
    },
  },
  {
    files: defaultExportAllowed,
    rules: { "import/no-default-export": "off" },
  },
  prettier,
]);
