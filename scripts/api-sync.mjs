/**
 * Atualiza `openapi/pethost.v1.json` a partir da API em execução (spec 001, REQ-TOOL-008).
 * Uso: `npm run api:sync` (BACKEND_URL opcional; padrão http://localhost:8080, o docker-compose do backend).
 * Só funciona com a API em Development, que é quando o documento OpenAPI é publicado.
 */
import { writeFile } from "node:fs/promises";

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const source = `${backendUrl}/openapi/v1.json`;

const response = await fetch(source).catch((error) => {
  throw new Error(`Não foi possível acessar ${source}. A API está rodando em Development? (${error.message})`);
});
if (!response.ok) {
  throw new Error(`${source} respondeu ${response.status}.`);
}

const document = await response.json();
await writeFile("openapi/pethost.v1.json", `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`openapi/pethost.v1.json atualizado de ${source}: ${Object.keys(document.paths ?? {}).length} rotas.`);
