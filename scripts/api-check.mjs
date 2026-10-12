/**
 * Falha se `src/shared/api/generated` não corresponder ao `openapi/pethost.v1.json` versionado
 * (spec 001, REQ-TOOL-009). Gera de novo e compara o conteúdo antes e depois.
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const generatedDir = "src/shared/api/generated";

async function hashDirectory(directory) {
  const hash = createHash("sha256");
  const entries = (await readdir(directory, { recursive: true, withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
    .sort();
  for (const file of entries) {
    hash.update(file.replaceAll("\\", "/"));
    hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

const before = await hashDirectory(generatedDir);
execSync("node node_modules/orval/dist/bin/orval.mjs", { stdio: "inherit" });
const after = await hashDirectory(generatedDir);

if (before !== after) {
  console.error("Contratos desatualizados: rode `npm run api:generate` e versione o resultado.");
  process.exit(1);
}
console.log("Contratos gerados batem com openapi/pethost.v1.json.");
