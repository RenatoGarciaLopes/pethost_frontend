import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { apiFail, apiOk, fakeJwt, nowSeconds, sessionFixture } from "@/test/fixtures/session";
import { DELETE, GET, PATCH, POST, PUT } from "./route";

const API = "http://api.test/api/v1";
const APP = "http://localhost:3000";

interface Init {
  method?: string;
  body?: BodyInit;
  contentType?: string;
  cookies?: Record<string, string>;
  csrf?: boolean;
}

function bffRequest(path: string, init: Init = {}) {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.7" });
  if (init.contentType) headers.set("content-type", init.contentType);
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
  return new NextRequest(`${APP}/api${path}`, { method: init.method ?? "GET", headers, body: init.body });
}

const freshAccess = () => fakeJwt(nowSeconds() + 600);
const cookieMap = (response: Response) =>
  Object.fromEntries(response.headers.getSetCookie().map((line) => [line.split("=")[0]!, line] as const));

describe("proxy do BFF", () => {
  it("REQ-HTTP-010 repassa Bearer, X-Forwarded-For e query; não repassa o cookie", async () => {
    let seen: Request | undefined;
    server.use(
      http.get(`${API}/hosts/:hostId/pets`, ({ request }) => {
        seen = request;
        return HttpResponse.json(apiOk([]));
      }),
    );
    const access = freshAccess();

    const response = await GET(
      bffRequest("/hosts/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c/pets?page=2", {
        cookies: { pethost_at: access, pethost_rt: "rt" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [] });
    expect(seen?.headers.get("authorization")).toBe(`Bearer ${access}`);
    expect(seen?.headers.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(seen?.headers.has("cookie")).toBe(false);
    expect(new URL(seen!.url).search).toBe("?page=2");
  });

  it("REQ-HTTP-010 devolve status, envelope e Retry-After sem alterar", async () => {
    server.use(
      http.post(`${API}/auth/password/forgot`, () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS", "Too many requests. Try again in 30 seconds."), {
          status: 429,
          headers: { "Retry-After": "30" },
        }),
      ),
    );

    const response = await POST(
      bffRequest("/auth/password/forgot", { method: "POST", body: "{}", contentType: "application/json" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect((await response.json()).error.code).toBe("TOO_MANY_REQUESTS");
  });

  it("REQ-HTTP-009 rota fora da lista → 404 ROUTE_NOT_ALLOWED sem chamar a API", async () => {
    const unknown = await GET(bffRequest("/internal/metrics"));
    const sessionRoute = await POST(
      bffRequest("/auth/sessions/login", { method: "POST", body: "{}", contentType: "application/json" }),
    );

    expect(unknown.status).toBe(404);
    expect((await unknown.json()).error.code).toBe("ROUTE_NOT_ALLOWED");
    expect(sessionRoute.status).toBe(404);
  });

  it("REQ-HTTP-013 mutação sem o cabeçalho do app → 403", async () => {
    const response = await DELETE(bffRequest("/owners/me/avatar", { method: "DELETE", csrf: false }));

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("CSRF_REJECTED");
  });

  it("REQ-HTTP-011 5 requisições paralelas com o access vencendo → 1 refresh; todas seguem com o token novo", async () => {
    let refreshCalls = 0;
    const renewed = sessionFixture({ refreshToken: "rt-parallel-2" });
    const bearers: string[] = [];
    server.use(
      http.post(`${API}/auth/sessions/refresh`, async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(apiOk(renewed));
      }),
      http.get(`${API}/pets/me`, ({ request }) => {
        bearers.push(request.headers.get("authorization") ?? "");
        return HttpResponse.json(apiOk([]));
      }),
    );
    const cookies = { pethost_at: fakeJwt(nowSeconds() + 10), pethost_rt: "rt-parallel-1" };

    const responses = await Promise.all(Array.from({ length: 5 }, () => GET(bffRequest("/pets/me", { cookies }))));

    expect(refreshCalls).toBe(1);
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200]);
    expect(bearers).toEqual(Array(5).fill(`Bearer ${renewed.accessToken}`));
    expect(cookieMap(responses[0]!).pethost_rt).toContain("pethost_rt=rt-parallel-2");
  });

  it("REQ-HTTP-011 API responde 401 → renova uma vez e repete a requisição", async () => {
    const renewed = sessionFixture({ refreshToken: "rt-retry-2" });
    let attempts = 0;
    server.use(
      http.post(`${API}/auth/sessions/refresh`, () => HttpResponse.json(apiOk(renewed))),
      http.patch(`${API}/owners/me`, async ({ request }) => {
        attempts += 1;
        if (request.headers.get("authorization") !== `Bearer ${renewed.accessToken}`) {
          return HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 });
        }
        return HttpResponse.json(apiOk({ echoed: await request.json() }));
      }),
    );

    const response = await PATCH(
      bffRequest("/owners/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: "Camila" }),
        contentType: "application/json",
        cookies: { pethost_at: freshAccess(), pethost_rt: "rt-retry-1" },
      }),
    );

    expect(attempts).toBe(2);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ echoed: { fullName: "Camila" } });
  });

  it("REQ-HTTP-012 refresh recusado → 401 SESSION_EXPIRED e cookies apagados", async () => {
    server.use(
      http.post(`${API}/auth/sessions/refresh`, () =>
        HttpResponse.json(apiFail("AUTH_REFRESH_TOKEN_INVALID"), { status: 401 }),
      ),
    );

    const response = await GET(bffRequest("/pets/me", { cookies: { pethost_rt: "rt-expired-proxy" } }));
    const cookies = cookieMap(response);

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("SESSION_EXPIRED");
    expect(cookies.pethost_at).toMatch(/Max-Age=0/);
    expect(cookies.pethost_rt).toMatch(/Max-Age=0/);
  });

  it("rejects legacy binary uploads before forwarding to the API", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(4_900_000)], "foto.jpg", { type: "image/jpeg" }));
    const encoded = new Request("http://x", { method: "PUT", body: form });
    const response = await PUT(
      bffRequest("/owners/me/avatar", {
        method: "PUT",
        body: encoded.body!,
        contentType: encoded.headers.get("content-type")!,
        cookies: { pethost_at: freshAccess(), pethost_rt: "rt" },
      }),
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("ROUTE_NOT_ALLOWED");
  });

  it("REQ-HTTP-004 API fora do ar → 502 UPSTREAM_UNAVAILABLE", async () => {
    server.use(http.get(`${API}/users/me`, () => HttpResponse.error()));

    const response = await GET(bffRequest("/users/me", { cookies: { pethost_at: freshAccess(), pethost_rt: "rt" } }));

    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("UPSTREAM_UNAVAILABLE");
  });
});
