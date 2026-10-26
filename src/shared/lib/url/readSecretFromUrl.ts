/**
 * Lê um segredo decodificado; o fragmento tem precedência, inclusive quando vazio.
 * @example readSecretFromUrl("token", { hash: "#token=a%2Bb", search: "" }) // "a+b"
 */
export function readSecretFromUrl(name: string, url: { hash: string; search: string }): string | null {
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = new URLSearchParams(url.search);
  return (fragment.has(name) ? fragment.get(name) : query.get(name)) || null;
}

function removeParameter(name: string, part: string, prefix: string): string {
  const params = new URLSearchParams(part.replace(/^[?#]/, ""));
  if (!params.has(name)) return part;
  params.delete(name);
  const remaining = params.toString();
  return remaining ? `${prefix}${remaining}` : "";
}

/**
 * Retira todas as ocorrências do segredo de query e fragmento, mantendo o caminho e outros parâmetros.
 * @example withoutSecret("token", { pathname: "/reset-password", search: "?token=abc&role=host", hash: "" }) // "/reset-password?role=host"
 */
export function withoutSecret(name: string, url: { pathname: string; hash: string; search: string }): string {
  return url.pathname + removeParameter(name, url.search, "?") + removeParameter(name, url.hash, "#");
}
