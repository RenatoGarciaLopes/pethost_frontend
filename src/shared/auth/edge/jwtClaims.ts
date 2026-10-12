import { accountRoleSchema, type AccountRole } from "../contracts/session";

/**
 * Lê o payload de um JWT **sem conferir a assinatura**. Serve só para decisões que não
 * dão acesso a nada: agendar o refresh (exp) e redirecionar cedo no `proxy.ts` (role).
 * Quem autoriza é a API; quem confirma a conta no servidor é `getSession`/`requireRole`.
 * Usa `atob` (sem `Buffer`) para rodar também no runtime do proxy.
 *
 * @returns o objeto de claims, ou `undefined` se o token for ilegível.
 */
export function readUnverifiedClaims(token: string): Record<string, unknown> | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return claims !== null && typeof claims === "object" && !Array.isArray(claims)
      ? (claims as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** Papel indicado no access token (sem verificar). Só para redirecionamento otimista (REQ-SHELL-009). */
export function readRoleHint(token: string | undefined): AccountRole | undefined {
  if (!token) return undefined;
  const parsed = accountRoleSchema.safeParse(readUnverifiedClaims(token)?.role);
  return parsed.success ? parsed.data : undefined;
}
