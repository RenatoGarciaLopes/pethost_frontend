import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { requestPasswordReset, resetPassword } from "./password.client";

const BASE = "http://bff.test/api";
const transport = createBffClient({ baseUrl: BASE });

describe("password.client", () => {
  it.each(["owner", "host", "admin"] as const)(
    "REQ-PWD-002 envia e-mail e papel %s sem outros campos",
    async (role) => {
      let body: unknown;
      let csrf: string | null = null;
      server.use(
        http.post(`${BASE}/auth/password/forgot`, async ({ request }) => {
          body = await request.json();
          csrf = request.headers.get("x-pethost-request");
          return HttpResponse.json(apiOk({}));
        }),
      );
      await expect(requestPasswordReset({ email: "pessoa@exemplo.test", role }, transport)).resolves.toBeUndefined();
      expect(body).toEqual({ email: "pessoa@exemplo.test", role });
      expect(csrf).toBe("1");
    },
  );
  it("REQ-PWD-008 envia apenas token e senha e ignora dados adicionais da resposta", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/auth/password/reset`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiOk({ extra: "compatibilidade" }));
      }),
    );
    await expect(resetPassword({ token: "a+b/=", newPassword: "Abcdef1!" }, transport)).resolves.toBeUndefined();
    expect(body).toEqual({ token: "a+b/=", newPassword: "Abcdef1!" });
  });
  it("REQ-PWD-009 mantém erros de campo da API", async () => {
    const details = [{ field: "newPassword", messages: ["Senha fraca."] }];
    server.use(
      http.post(`${BASE}/auth/password/reset`, () =>
        HttpResponse.json(apiFail("VALIDATION_ERROR", "Inválido", details), { status: 400 }),
      ),
    );
    await expect(resetPassword({ token: "valido", newPassword: "Abcdef1!" }, transport)).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fieldErrors: { newPassword: ["Senha fraca."] },
    });
  });
  it("REQ-PWD-010 propaga token inválido", async () => {
    server.use(
      http.post(`${BASE}/auth/password/reset`, () =>
        HttpResponse.json(apiFail("AUTH_PASSWORD_RESET_TOKEN_INVALID"), { status: 401 }),
      ),
    );
    await expect(resetPassword({ token: "expirado", newPassword: "Abcdef1!" }, transport)).rejects.toMatchObject({
      code: "AUTH_PASSWORD_RESET_TOKEN_INVALID",
    });
  });
  it("REQ-PWD-012 preserva Retry-After no pedido limitado", async () => {
    server.use(
      http.post(`${BASE}/auth/password/forgot`, () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "42" } }),
      ),
    );
    await expect(
      requestPasswordReset({ email: "pessoa@exemplo.test", role: "owner" }, transport),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", retryAfterSeconds: 42 });
  });
  it("REQ-PWD-012 propaga falha de rede", async () => {
    server.use(http.post(`${BASE}/auth/password/reset`, () => HttpResponse.error()));
    await expect(resetPassword({ token: "valido", newPassword: "Abcdef1!" }, transport)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
