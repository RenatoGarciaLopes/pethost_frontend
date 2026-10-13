import { http, HttpResponse } from "msw";
import { switchAccounts } from "./switchAccounts.mjs";

/**
 * Sessão simulada para o E2E (spec 003). Estado em memória por processo; nada aqui é credencial real.
 * Conta de demonstração: `tutora@pethost.test` com a senha `senha-de-teste` (só existe neste mock).
 */
const API = "http://localhost:5099/api/v1";
const demoAccount = switchAccounts[0];
const demoUser = demoAccount.user;
export const DEMO = { email: demoUser.email, password: demoAccount.password, role: demoUser.role };

/** Token → conta dona dele: o `/users/me` e o refresh devolvem a conta certa (tutor ou anfitrião). */
const accessTokens = new Map();
const refreshTokens = new Map();
let counter = 0;

/**
 * Conta dona do access token apresentado; não confia em claims decodificados (somente mock).
 * @example const user = sessionUserOf(request); if (!user) return fail(401, "UNAUTHORIZED");
 */
export function sessionUserOf(request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  return accessTokens.get(token);
}

/** Revoga access e refresh de todas as sessões só da conta indicada (mock 015). @example revokeUserSessions(user.id); */
export function revokeUserSessions(userId) {
  for (const [token, user] of accessTokens) if (user.id === userId) accessTokens.delete(token);
  for (const [token, user] of refreshTokens) if (user.id === userId) refreshTokens.delete(token);
}

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
export const ok = (data, init) => HttpResponse.json({ success: true, data, timestamp: new Date().toISOString() }, init);
export const fail = (status, code, details) =>
  HttpResponse.json(
    {
      success: false,
      error: { code, message: code, ...(details ? { details } : {}) },
      timestamp: new Date().toISOString(),
    },
    { status },
  );

/**
 * Abre uma sessão nova para a conta (a de demonstração por padrão), com os tokens guardados em memória
 * e aceitos pelo `/users/me` e pelo refresh.
 */
export function issueSession(user = demoUser) {
  counter += 1;
  const expiresAt = Math.floor(Date.now() / 1000) + 900;
  const accessToken = `${encode({ alg: "none" })}.${encode({ sub: user.id, exp: expiresAt, n: counter })}.e2e`;
  const refreshToken = `rt-e2e-${counter}`;
  accessTokens.set(accessToken, user);
  refreshTokens.set(refreshToken, user);
  return { accessToken, refreshToken, expiresAt, user };
}

export const sessionHandlers = [
  http.post(`${API}/auth/sessions/login`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const account = switchAccounts.find(
      (item) =>
        item.user.email === body?.email &&
        item.password === body?.password &&
        item.user.role === body?.role &&
        item.user.isActive,
    );
    return account ? ok(issueSession(account.user)) : fail(401, "AUTH_INVALID_CREDENTIALS");
  }),
  http.post(`${API}/auth/sessions/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json().catch(() => ({}));
    const user = refreshTokens.get(refreshToken);
    // Uso único, como na API (GETDEL).
    if (!refreshTokens.delete(refreshToken)) return fail(401, "AUTH_REFRESH_TOKEN_INVALID");
    return ok(issueSession(user));
  }),
  http.post(`${API}/auth/sessions/logout`, async ({ request }) => {
    const { refreshToken } = await request.json().catch(() => ({}));
    refreshTokens.delete(refreshToken);
    return ok({});
  }),
  http.get(`${API}/users/me`, ({ request }) => {
    const user = sessionUserOf(request);
    return user ? ok(user) : fail(401, "UNAUTHORIZED");
  }),
];

/** Entrega um refresh token válido sem passar pelo login (para testar o refresh direto). */
export const seedRefreshToken = () => issueSession().refreshToken;
