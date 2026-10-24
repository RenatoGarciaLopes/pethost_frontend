import { defineConfig } from "orval";

/**
 * Contratos gerados da API (spec 001, REQ-TOOL-008).
 *
 * Entrada: `openapi/pethost.v1.json`, versionado e atualizado por `npm run api:sync`.
 * Saída: schemas Zod em `src/shared/api/generated/` (nunca editar à mão).
 * `generated/errorCodes.ts` (enum `ApiErrorCode`) sai do hook `scripts/generate-error-codes.mjs`.
 * Os tipos TypeScript saem dos schemas com `z.infer`; o transporte HTTP é escrito
 * à mão em `src/shared/api` (spec 003), por isso nenhum cliente é gerado aqui.
 */
export default defineConfig({
  pethost: {
    input: {
      target: "./openapi/pethost.v1.json",
      override: { transformer: "./scripts/openapi-transformer.mjs" },
    },
    output: {
      mode: "tags-split",
      client: "zod",
      target: "./src/shared/api/generated/pethost.ts",
      fileExtension: ".zod.ts",
    },
    hooks: { afterAllFilesWrite: "node scripts/generate-error-codes.mjs" },
  },
});
