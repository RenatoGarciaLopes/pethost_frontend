/**
 * Valida um destino de redirecionamento vindo da URL (`next`). Só aceita caminho interno
 * do app: começa com uma barra, não aponta para outro host e não entra no BFF (`/api`).
 * Evita redirecionamento aberto depois do login ou do refresh.
 *
 * @returns o caminho, ou `fallback` se for inseguro.
 * @example toSafeInternalPath(searchParams.get("next"), "/")
 */
export function toSafeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  const url = new URL(value, "http://pethost.internal");
  if (url.origin !== "http://pethost.internal") return fallback;
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
