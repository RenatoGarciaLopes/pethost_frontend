/**
 * Normaliza o OpenAPI do .NET antes do Orval (spec 001, REQ-TOOL-008).
 *
 * 1. O ASP.NET Core 10 descreve números como `type: ["integer", "string"]` com `pattern`,
 *    porque aceita número escrito como texto na entrada. A API **responde** números de verdade,
 *    e o tipo duplo faz o Orval gerar `default` numérico num ramo string (erro de TypeScript).
 *    Aqui o tipo vira só o numérico (preservando `null` quando existir) e o `pattern` sai.
 * 2. A API omite campos `null` na resposta (`modulo-auth.md` seção 3), mas o documento os marca
 *    como obrigatórios. Campo anulável sai do `required`, senão o schema recusa a resposta real.
 *
 * @param {Record<string, unknown>} document documento OpenAPI 3.1
 * @returns {Record<string, unknown>} o mesmo documento, normalizado
 */
export default function transformOpenApi(document) {
  normalizeNode(document);
  return document;
}

/** Percorre o documento aplicando as duas normalizações em cada schema. */
export function normalizeNode(node) {
  if (Array.isArray(node)) {
    node.forEach(normalizeNode);
    return;
  }
  if (node === null || typeof node !== "object") return;

  if (Array.isArray(node.type) && node.type.includes("string")) {
    const numeric = node.type.find((type) => type === "integer" || type === "number");
    if (numeric) {
      const keepsNull = node.type.includes("null");
      node.type = keepsNull ? [numeric, "null"] : numeric;
      delete node.pattern;
    }
  }

  if (Array.isArray(node.required) && node.properties && typeof node.properties === "object") {
    node.required = node.required.filter((name) => !isNullable(node.properties[name]));
    if (node.required.length === 0) delete node.required;
  }

  Object.values(node).forEach(normalizeNode);
}

/** `true` quando o schema aceita `null` (tipo, `nullable` ou um ramo de `oneOf`/`anyOf`). */
function isNullable(schema) {
  if (schema === null || typeof schema !== "object") return false;
  if (schema.nullable === true || schema.type === "null") return true;
  if (Array.isArray(schema.type) && schema.type.includes("null")) return true;
  return [schema.oneOf, schema.anyOf].some((branches) => Array.isArray(branches) && branches.some(isNullable));
}
