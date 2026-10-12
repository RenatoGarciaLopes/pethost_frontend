import { http, HttpResponse } from "msw";

/**
 * Sessão simulada para o E2E (spec 003). Estado em memória por processo; nada aqui é credencial real.
 * Conta de demonstração: `tutora@pethost.test` com a senha `senha-de-teste` (só existe neste mock).
 */
const API = "http://localhost:5099/api/v1";
const DEMO = { email: "tutora@pethost.test", password: "senha-de-teste", role: "owner" };
const user = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  fullName: "Camila Souza",
  email: DEMO.email,
  role: "owner",
  isActive: true,
};

const accessTokens = new Set();
const refreshTokens = new Set();
let counter = 0;

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const ok = (data, init) => HttpResponse.json({ success: true, data, timestamp: new Date().toISOString() }, init);
const fail = (status, code) =>
  HttpResponse.json(
    { success: false, error: { code, message: code }, timestamp: new Date().toISOString() },
    { status },
  );

function issueSession() {
  counter += 1;
  const expiresAt = Math.floor(Date.now() / 1000) + 900;
  const accessToken = `${encode({ alg: "none" })}.${encode({ sub: user.id, exp: expiresAt, n: counter })}.e2e`;
  const refreshToken = `rt-e2e-${counter}`;
  accessTokens.add(accessToken);
  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken, expiresAt, user };
}

export const sessionHandlers = [
  http.post(`${API}/auth/sessions/login`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const valid = body?.email === DEMO.email && body?.password === DEMO.password && body?.role === DEMO.role;
    return valid ? ok(issueSession()) : fail(401, "AUTH_INVALID_CREDENTIALS");
  }),
  http.post(`${API}/auth/sessions/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json().catch(() => ({}));
    // Uso único, como na API (GETDEL).
    if (!refreshTokens.delete(refreshToken)) return fail(401, "AUTH_REFRESH_TOKEN_INVALID");
    return ok(issueSession());
  }),
  http.post(`${API}/auth/sessions/logout`, async ({ request }) => {
    const { refreshToken } = await request.json().catch(() => ({}));
    refreshTokens.delete(refreshToken);
    return ok({});
  }),
  http.get(`${API}/users/me`, ({ request }) => {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
    return accessTokens.has(token) ? ok(user) : fail(401, "UNAUTHORIZED");
  }),
];

/** Entrega um refresh token válido sem passar pelo login (para testar o refresh direto). */
export const seedRefreshToken = () => issueSession().refreshToken;
