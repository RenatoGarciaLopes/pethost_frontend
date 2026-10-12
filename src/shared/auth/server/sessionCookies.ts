import "server-only";
import { readUnverifiedClaims } from "../edge/jwtClaims";

/** Cookie do access token: vai para páginas (RSC) e BFF. */
export const ACCESS_COOKIE = "pethost_at";
/** Cookie do refresh token: só nas rotas do BFF (`/api`), nunca nas páginas. */
export const REFRESH_COOKIE = "pethost_rt";

const ACCESS_PATH = "/";
const REFRESH_PATH = "/api";
export const DEFAULT_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Tokens da resposta de sessão da API (`modulo-auth.md` seção 2.6). */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix segundos. */
  expiresAt: number;
}

export interface CookieWrite {
  name: string;
  value: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

/** Subconjunto comum de `cookies()` (next/headers) e `NextResponse.cookies`. */
export interface CookieReader {
  get(name: string): { value: string } | undefined;
}
export interface CookieWriter {
  set(cookie: CookieWrite): unknown;
}

export interface SessionCookieOptions {
  /** `Secure` no cookie; use `isSecureOrigin(request.url)`. */
  secure: boolean;
  /** Relógio em ms (testes). */
  now?: number;
  refreshMaxAgeSeconds?: number;
}

/** Monta os dois cookies de sessão (função pura). */
export function buildSessionCookies(tokens: SessionTokens, options: SessionCookieOptions): [CookieWrite, CookieWrite] {
  const now = options.now ?? Date.now();
  const base = { httpOnly: true as const, secure: options.secure, sameSite: "lax" as const };
  return [
    {
      ...base,
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      path: ACCESS_PATH,
      maxAge: Math.max(0, Math.floor(tokens.expiresAt - now / 1000)),
    },
    {
      ...base,
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      path: REFRESH_PATH,
      maxAge: options.refreshMaxAgeSeconds ?? DEFAULT_REFRESH_MAX_AGE_SECONDS,
    },
  ];
}

export function setSessionCookies(store: CookieWriter, tokens: SessionTokens, options: SessionCookieOptions): void {
  for (const cookie of buildSessionCookies(tokens, options)) store.set(cookie);
}

/** Apaga os dois cookies (mesmo `Path` de quando foram gravados, senão o navegador não apaga). */
export function clearSessionCookies(store: CookieWriter, options: Pick<SessionCookieOptions, "secure">): void {
  const base = { httpOnly: true as const, secure: options.secure, sameSite: "lax" as const, value: "", maxAge: 0 };
  store.set({ ...base, name: ACCESS_COOKIE, path: ACCESS_PATH });
  store.set({ ...base, name: REFRESH_COOKIE, path: REFRESH_PATH });
}

export function readSessionTokens(store: CookieReader): { accessToken?: string; refreshToken?: string } {
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value || undefined,
    refreshToken: store.get(REFRESH_COOKIE)?.value || undefined,
  };
}

/**
 * Lê o `exp` do JWT **só para agendar o refresh**. Não valida assinatura e não decide identidade
 * (quem decide é a API; ver `getSession`).
 * @returns Unix segundos, ou `undefined` se ilegível (trate como vencido).
 */
export function readAccessTokenExpiry(accessToken: string): number | undefined {
  const exp = readUnverifiedClaims(accessToken)?.exp;
  return typeof exp === "number" ? exp : undefined;
}

/** `false` só em http://localhost e loopback (dev); qualquer outra origem exige `Secure`. */
export function isSecureOrigin(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  if (protocol === "https:") return true;
  return !["localhost", "127.0.0.1", "[::1]"].includes(hostname) && !hostname.endsWith(".localhost");
}
