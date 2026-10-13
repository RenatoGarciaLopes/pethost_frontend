import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { switchAccount } from "./switchAccount.client";

it("REQ-SWITCH-005 valida e reduz corpo ao contrato, com CSRF e resposta de sessão do BFF", async () => {
  let body: unknown;
  let csrf: string | null = null;
  server.use(
    http.post("http://bff.test/api/auth/sessions/switch", async ({ request }) => {
      body = await request.json();
      csrf = request.headers.get("x-pethost-request");
      return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: "host" } }));
    }),
  );
  const input = { role: "host" as const, password: "senha-sintetica", extra: "não enviar" };
  const result = await switchAccount(input, createBffClient({ baseUrl: "http://bff.test/api" }));
  expect(body).toEqual({ role: "host", password: "senha-sintetica" });
  expect(csrf).toBe("1");
  expect(result).toEqual({ user: { ...sessionUserFixture, role: "host" } });
});
it("REQ-SWITCH-005 rejeita sessão sem user na resposta do BFF", async () => {
  server.use(http.post("http://bff.test/api/auth/sessions/switch", () => HttpResponse.json(apiOk({}))));
  await expect(
    switchAccount({ role: "host", password: "senha-sintetica" }, createBffClient({ baseUrl: "http://bff.test/api" })),
  ).rejects.toMatchObject({ code: "CONTRACT_MISMATCH" });
});
