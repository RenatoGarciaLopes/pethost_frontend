import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { login, reactivateAccount } from "./auth.client";

const transport = createBffClient({ baseUrl: "http://api.test/api" });
it.each(["owner", "host", "admin"] as const)(
  "REQ-AUTH-004/018 login envia papel %s e devolve apenas user",
  async (role) => {
    const values = { email: "teste@exemplo.com", password: "senha", role };
    let received: unknown;
    let csrf: string | null = null;
    server.use(
      http.post("http://api.test/api/auth/sessions/login", async ({ request }) => {
        received = await request.json();
        csrf = request.headers.get("x-pethost-request");
        return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role }, accessToken: "nao-expor" }));
      }),
    );
    await expect(login(values, transport)).resolves.toEqual({ user: { ...sessionUserFixture, role } });
    expect(received).toEqual(values);
    expect(csrf).toBe("1");
  },
);
it.each(["owner", "host"] as const)("REQ-AUTH-008 reativa pela rota do papel %s", async (role) => {
  const values = { email: "teste@exemplo.com", password: "senha", role };
  let received: unknown;
  server.use(
    http.post(`http://api.test/api/${role === "owner" ? "owners" : "hosts"}/reactivate`, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role } }));
    }),
  );
  await expect(reactivateAccount(values, transport)).resolves.toEqual({ user: { ...sessionUserFixture, role } });
  expect(received).toEqual(values);
});
it.each([
  [401, "AUTH_INVALID_CREDENTIALS"],
  [403, "AUTH_ACCOUNT_DEACTIVATED"],
  [403, "AUTH_ACCOUNT_SUSPENDED"],
  [429, "TOO_MANY_REQUESTS"],
])("REQ-AUTH-007/010 preserva erro %s %s", async (status, code) => {
  server.use(
    http.post("http://api.test/api/auth/sessions/login", () =>
      HttpResponse.json(apiFail(String(code)), {
        status: Number(status),
        headers: { "Retry-After": "7" },
      }),
    ),
  );
  await expect(login({ email: "a@b.com", password: "x", role: "owner" }, transport)).rejects.toMatchObject({
    code,
    status,
    retryAfterSeconds: 7,
  });
});
it("REQ-AUTH-018 rejeita sessão fora do contrato", async () => {
  server.use(
    http.post("http://api.test/api/auth/sessions/login", () => HttpResponse.json(apiOk({ accessToken: "token" }))),
  );
  await expect(login({ email: "a@b.com", password: "x", role: "owner" }, transport)).rejects.toMatchObject({
    code: "CONTRACT_MISMATCH",
  });
});
