import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { apiFail, apiOk, fakeJwt, nowSeconds, sessionUserFixture } from "@/test/fixtures/session";
import { createSessionReader } from "./getSession";

const API = "http://api.test/api/v1";

function reader(cookies: Record<string, string>) {
  return createSessionReader({
    readCookies: async () => ({ get: (name: string) => (name in cookies ? { value: cookies[name]! } : undefined) }),
    readHeaders: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
  });
}

describe("createSessionReader", () => {
  it("REQ-HTTP-015 sem cookie → anonymous, sem chamar a API", async () => {
    await expect(reader({})()).resolves.toEqual({ status: "anonymous" });
  });

  it("REQ-HTTP-015 access válido → conta atual vinda da API (não do JWT)", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/users/me`, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json(apiOk(sessionUserFixture));
      }),
    );
    const access = fakeJwt(nowSeconds() + 600);

    const state = await reader({ pethost_at: access, pethost_rt: "rt" })();

    expect(state).toEqual({ status: "authenticated", user: expect.objectContaining({ role: "owner" }) });
    expect(authorization).toBe(`Bearer ${access}`);
  });

  it("REQ-HTTP-016 access vencido ou ausente com refresh → refresh-required (RSC não grava cookie)", async () => {
    await expect(reader({ pethost_at: fakeJwt(nowSeconds() - 1), pethost_rt: "rt" })()).resolves.toEqual({
      status: "refresh-required",
    });
    await expect(reader({ pethost_rt: "rt" })()).resolves.toEqual({ status: "refresh-required" });
  });

  it("REQ-HTTP-016 API recusa o access (revogado) → refresh-required se houver refresh, senão anonymous", async () => {
    server.use(http.get(`${API}/users/me`, () => HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 })));
    const access = fakeJwt(nowSeconds() + 600);

    await expect(reader({ pethost_at: access, pethost_rt: "rt" })()).resolves.toEqual({ status: "refresh-required" });
    await expect(reader({ pethost_at: access })()).resolves.toEqual({ status: "anonymous" });
  });

  it("REQ-HTTP-015 API fora do ar propaga o erro (vai para a tela de erro, não para o login)", async () => {
    server.use(http.get(`${API}/users/me`, () => HttpResponse.error()));

    await expect(reader({ pethost_at: fakeJwt(nowSeconds() + 600) })()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
