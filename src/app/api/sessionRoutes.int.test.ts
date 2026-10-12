import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { apiFail, apiOk, fakeJwt, nowSeconds, sessionFixture } from "@/test/fixtures/session";
import { POST as login } from "./auth/sessions/login/route";
import { POST as logout } from "./auth/sessions/logout/route";
import { GET as refreshGet, POST as refreshPost } from "./auth/sessions/refresh/route";
import { POST as switchAccount } from "./auth/sessions/switch/route";
import { POST as reactivateHost } from "./hosts/reactivate/route";
import { POST as reactivateOwner } from "./owners/reactivate/route";
import { POST as registerOwner } from "./owners/register/route";
import { POST as changePassword } from "./users/me/password/route";
import { POST as registerHost } from "./users/register/route";

const API = "http://api.test/api/v1";
const APP = "http://localhost:3000";

function bffRequest(
  path: string,
  init: { method?: string; body?: unknown; cookies?: Record<string, string>; csrf?: boolean } = {},
) {
  const headers = new Headers({ "content-type": "application/json", "x-forwarded-for": "203.0.113.7" });
  if (init.csrf !== false) {
    headers.set("origin", APP);
    headers.set("x-pethost-request", "1");
  }
  if (init.cookies) {
    headers.set(
      "cookie",
      Object.entries(init.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
    );
  }
  return new NextRequest(`${APP}${path}`, {
    method: init.method ?? "POST",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function setCookies(response: Response): Record<string, string> {
  return Object.fromEntries(response.headers.getSetCookie().map((line) => [line.split("=")[0]!, line] as const));
}

const sessionRoutes = [
  { name: "login", handler: login, path: "/auth/sessions/login", status: 200 },
  { name: "cadastro de tutor", handler: registerOwner, path: "/owners/register", status: 201 },
  { name: "cadastro de anfitrião", handler: registerHost, path: "/users/register", status: 201 },
  { name: "reativação de tutor", handler: reactivateOwner, path: "/owners/reactivate", status: 200 },
  { name: "reativação de anfitrião", handler: reactivateHost, path: "/hosts/reactivate", status: 200 },
] as const;

describe.each(sessionRoutes)("$name", ({ handler, path, status }) => {
  it("REQ-HTTP-007 grava cookies HttpOnly e devolve só o user, sem tokens", async () => {
    let forwarded: string | null = null;
    server.use(
      http.post(`${API}${path}`, ({ request }) => {
        forwarded = request.headers.get("x-forwarded-for");
        return HttpResponse.json(apiOk(sessionFixture()), { status });
      }),
    );

    const response = await handler(bffRequest(`/api${path}`, { body: { email: "c@x.co" } }));
    const body = await response.json();
    const cookies = setCookies(response);

    expect(response.status).toBe(status);
    expect(body.data).toEqual({ user: expect.objectContaining({ email: "camila@exemplo.com" }) });
    expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken|rt-new/);
    expect(cookies.pethost_at).toMatch(/HttpOnly/i);
    expect(cookies.pethost_at).toMatch(/SameSite=lax/i);
    expect(cookies.pethost_at).toMatch(/Max-Age=(899|900)/);
    expect(cookies.pethost_rt).toMatch(/Path=\/api/);
    expect(forwarded).toBe("203.0.113.7");
  });

  it("REQ-HTTP-002 erro da API passa no envelope e não grava cookie", async () => {
    server.use(
      http.post(`${API}${path}`, () => HttpResponse.json(apiFail("AUTH_INVALID_CREDENTIALS"), { status: 401 })),
    );

    const response = await handler(bffRequest(`/api${path}`, { body: {} }));

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("REQ-HTTP-013 sem o cabeçalho do app → 403 CSRF_REJECTED, sem chamar a API", async () => {
    const response = await handler(bffRequest(`/api${path}`, { body: {}, csrf: false }));

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("CSRF_REJECTED");
  });
});

describe.each([
  { name: "troca de conta", handler: switchAccount, path: "/auth/sessions/switch", revokes: true },
  { name: "troca de senha", handler: changePassword, path: "/users/me/password", revokes: false },
])("$name (com sessão)", ({ handler, path, revokes }) => {
  it("REQ-HTTP-017 manda o Bearer e regrava os cookies com a sessão nova", async () => {
    let authorization: string | null = null;
    server.use(
      http.post(`${API}${path}`, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json(apiOk(sessionFixture({ role: "host" })));
      }),
    );
    let revoked: unknown;
    if (revokes) {
      server.use(
        http.post(`${API}/auth/sessions/logout`, async ({ request }) => {
          revoked = await request.json();
          return HttpResponse.json(apiOk({}));
        }),
      );
    }
    const accessToken = fakeJwt(nowSeconds() + 600);

    const response = await handler(
      bffRequest(`/api${path}`, { body: {}, cookies: { pethost_at: accessToken, pethost_rt: "rt-1" } }),
    );

    expect(response.status).toBe(200);
    expect(authorization).toBe(`Bearer ${accessToken}`);
    expect(setCookies(response).pethost_rt).toContain("pethost_rt=rt-new");
    // T16: a troca de conta revoga o refresh da conta anterior.
    expect(revoked).toEqual(revokes ? { refreshToken: "rt-1" } : undefined);
  });

  it("REQ-HTTP-012 sem sessão → 401 SESSION_EXPIRED sem chamar a API", async () => {
    const response = await handler(bffRequest(`/api${path}`, { body: {} }));

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
  });
});

describe("refresh", () => {
  it("REQ-HTTP-011 POST renova, regrava cookies e devolve o user", async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/auth/sessions/refresh`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(apiOk(sessionFixture({ refreshToken: "rt-2" })));
      }),
    );

    const response = await refreshPost(
      bffRequest("/api/auth/sessions/refresh", { cookies: { pethost_rt: "rt-post" } }),
    );

    expect(response.status).toBe(200);
    expect(sent).toEqual({ refreshToken: "rt-post" });
    expect(setCookies(response).pethost_rt).toContain("pethost_rt=rt-2");
  });

  it("REQ-HTTP-012 refresh recusado → 401 SESSION_EXPIRED e cookies apagados", async () => {
    server.use(
      http.post(`${API}/auth/sessions/refresh`, () =>
        HttpResponse.json(apiFail("AUTH_REFRESH_TOKEN_INVALID"), { status: 401 }),
      ),
    );

    const response = await refreshPost(
      bffRequest("/api/auth/sessions/refresh", { cookies: { pethost_rt: "rt-dead" } }),
    );
    const cookies = setCookies(response);

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
    expect(cookies.pethost_at).toMatch(/Max-Age=0/);
    expect(cookies.pethost_rt).toMatch(/Max-Age=0/);
  });

  it("REQ-HTTP-016 GET renova e volta para o next seguro", async () => {
    server.use(http.post(`${API}/auth/sessions/refresh`, () => HttpResponse.json(apiOk(sessionFixture()))));

    const response = await refreshGet(
      bffRequest("/api/auth/sessions/refresh?next=%2Fpets%3Ftab%3D1", {
        method: "GET",
        cookies: { pethost_rt: "rt-get" },
        csrf: false,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${APP}/pets?tab=1`);
    expect(setCookies(response).pethost_at).toBeDefined();
  });

  it("REQ-HTTP-016 GET com next externo ou sessão vencida vai para o login", async () => {
    server.use(
      http.post(`${API}/auth/sessions/refresh`, () =>
        HttpResponse.json(apiFail("AUTH_REFRESH_TOKEN_INVALID"), { status: 401 }),
      ),
    );

    const response = await refreshGet(
      bffRequest("/api/auth/sessions/refresh?next=https%3A%2F%2Fevil.example", {
        method: "GET",
        cookies: { pethost_rt: "rt-get-dead" },
        csrf: false,
      }),
    );

    expect(response.headers.get("location")).toBe(`${APP}/login`);
  });
});

describe("logout", () => {
  it("REQ-HTTP-017 revoga o refresh na API e apaga os cookies", async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/auth/sessions/logout`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(apiOk({}));
      }),
    );

    const response = await logout(bffRequest("/api/auth/sessions/logout", { cookies: { pethost_rt: "rt-out" } }));

    expect(response.status).toBe(200);
    expect(sent).toEqual({ refreshToken: "rt-out" });
    expect(setCookies(response).pethost_rt).toMatch(/Max-Age=0/);
  });

  it("REQ-HTTP-017 API fora do ar ainda apaga os cookies", async () => {
    server.use(http.post(`${API}/auth/sessions/logout`, () => HttpResponse.error()));

    const response = await logout(bffRequest("/api/auth/sessions/logout", { cookies: { pethost_rt: "rt-x" } }));

    expect(response.status).toBe(200);
    expect(setCookies(response).pethost_at).toMatch(/Max-Age=0/);
  });
});
