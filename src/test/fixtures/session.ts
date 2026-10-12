/**
 * Dados de sessão para testes (formato de `modulo-auth.md` seção 2.6). Nada aqui é credencial real.
 */

/** JWT de teste só com o `exp` (a assinatura não é conferida no front). */
export function fakeJwt(expUnixSeconds: number, sub = "user-1"): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub, exp: expUnixSeconds })}.test-signature`;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export const sessionUserFixture = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  role: "owner",
  isActive: true,
} as const;

/** Resposta de sessão da API com tokens novos que vencem em 15 min. */
export function sessionFixture(overrides: { refreshToken?: string; role?: string } = {}) {
  const expiresAt = nowSeconds() + 900;
  return {
    accessToken: fakeJwt(expiresAt),
    refreshToken: overrides.refreshToken ?? "rt-new",
    expiresAt,
    user: { ...sessionUserFixture, role: overrides.role ?? sessionUserFixture.role },
  };
}

/** Envelope de sucesso da API. */
export const apiOk = (data: unknown) => ({ success: true, data, timestamp: new Date().toISOString() });

/** Envelope de erro da API. */
export const apiFail = (code: string, message = code, details?: unknown) => ({
  success: false,
  error: { code, message, ...(details ? { details } : {}) },
  timestamp: new Date().toISOString(),
});
