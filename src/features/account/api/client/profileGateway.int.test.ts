import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { accountAddressFixture, hostProfileDtoFixture, ownerProfileDtoFixture } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { gatewayFor } from "./profileGateway";
const BASE = "http://bff.test/api";
const transport = createBffClient({ baseUrl: BASE });
it.each(["owner", "host"] as const)("REQ-ACC-004/009 adapta perfil %s sem perder campos", async (role) => {
  server.use(
    http.get(`${BASE}/${role}s/me`, () =>
      HttpResponse.json(apiOk(role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture)),
    ),
  );
  const profile = await gatewayFor(role, transport).load();
  expect(profile).toMatchObject({
    role,
    fullName: "Camila Souza",
    cpf: "52998224725",
    birthDate: "1990-05-03",
    address: accountAddressFixture,
    memberSince: "2026-10-13T12:00:00Z",
    verified: true,
  });
});
it("REQ-ACC-009 adapta dados de empresa", async () => {
  const company = {
    cnpj: "11222333000181",
    legalName: "Empresa de Teste",
    tradeName: "Cantinho",
    address: accountAddressFixture,
  };
  server.use(
    http.get(`${BASE}/hosts/me`, () =>
      HttpResponse.json(apiOk({ ...hostProfileDtoFixture, personType: "company", company })),
    ),
  );
  expect((await gatewayFor("host", transport).load()).company).toEqual(company);
});
it("REQ-ACC-011 apenas HOST_NOT_FOUND faz fallback para conta sem data inventada", async () => {
  let calls = 0;
  server.use(
    http.get(`${BASE}/hosts/me`, () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })),
    http.get(`${BASE}/users/me`, () => {
      calls++;
      return HttpResponse.json(apiOk(hostProfileDtoFixture.user));
    }),
  );
  expect(await gatewayFor("host", transport).load()).toMatchObject({
    role: "host",
    cpf: null,
    company: null,
    memberSince: null,
    verified: false,
  });
  expect(calls).toBe(1);
  server.use(http.get(`${BASE}/hosts/me`, () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })));
  await expect(gatewayFor("host", transport).load()).rejects.toMatchObject({ code: "UNEXPECTED_ERROR" });
  expect(calls).toBe(1);
});
it("REQ-ACC-004 DTO inválido ou conta ausente falha como contrato", async () => {
  for (const data of [
    { ...ownerProfileDtoFixture, user: null },
    { ...ownerProfileDtoFixture, user: { ...ownerProfileDtoFixture.user, role: "host" } },
    { ...ownerProfileDtoFixture, createdAt: "ontem" },
  ]) {
    server.use(http.get(`${BASE}/owners/me`, () => HttpResponse.json(apiOk(data))));
    await expect(gatewayFor("owner", transport).load()).rejects.toMatchObject({ code: "CONTRACT_MISMATCH" });
  }
});
it.each(["owner", "host"] as const)("REQ-ACC-006 PATCH %s preserva só campos do contrato", async (role) => {
  let seen: unknown;
  server.use(
    http.patch(`${BASE}/${role}s/me`, async ({ request }) => {
      seen = await request.json();
      expect(request.headers.get("x-pethost-request")).toBe("1");
      return HttpResponse.json(apiOk(role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture));
    }),
  );
  await gatewayFor(role, transport).save({ phone: "11999999999", ...{ email: "não enviar" } });
  expect(seen).toEqual({ phone: "11999999999" });
});
it.each(["owner", "host"] as const)("REQ-ACC-015/016 foto %s usa multipart file e DELETE", async (role) => {
  const dto = role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture;
  server.use(
    http.put(`${BASE}/${role}s/me/avatar`, async ({ request }) => {
      expect(request.headers.get("content-type")).toContain("multipart/form-data; boundary=");
      const body = await request.formData();
      const file = body.get("file") as File;
      expect([...body.keys()]).toEqual(["file"]);
      expect(file.name).toBe("foto.png");
      expect(await file.text()).toBe("imagem de teste");
      return HttpResponse.json(
        apiOk({ ...dto, user: { ...dto.user, avatarUrl: "https://images.example.test/avatar.png" } }),
      );
    }),
    http.delete(`${BASE}/${role}s/me/avatar`, () => HttpResponse.json(apiOk(dto))),
  );
  const gateway = gatewayFor(role, transport);
  expect((await gateway.uploadAvatar(new File(["imagem de teste"], "foto.png", { type: "image/png" }))).avatarUrl).toBe(
    "https://images.example.test/avatar.png",
  );
  expect((await gateway.removeAvatar()).avatarUrl).toBeNull();
});
it.each([
  ["OWNER_CPF_LOCKED", 422],
  ["OWNER_BIRTH_DATE_LOCKED", 422],
  ["OWNER_CPF_ALREADY_REGISTERED", 409],
  ["PAYLOAD_TOO_LARGE", 413],
  ["HOST_IDENTITY_LOCKED", 422],
  ["HOST_NOT_A_COMPANY", 422],
] as const)("REQ-ACC-007/008/010/017 mantém %s", async (code, status) => {
  const role = code.startsWith("HOST") ? "host" : "owner";
  server.use(http.patch(`${BASE}/${role}s/me`, () => HttpResponse.json(apiFail(code), { status })));
  await expect(gatewayFor(role, transport).save({ phone: "11999999999" })).rejects.toMatchObject({ code, status });
});
it("REQ-ACC-020/028 conserva campos e Retry-After", async () => {
  server.use(
    http.patch(`${BASE}/owners/me`, () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "Inválido", [{ field: "currentPassword", messages: ["Confira a senha."] }]),
        { status: 400 },
      ),
    ),
  );
  await expect(gatewayFor("owner", transport).save({ cpf: "16899535009" })).rejects.toMatchObject({
    fieldErrors: { currentPassword: ["Confira a senha."] },
  });
  server.use(
    http.patch(`${BASE}/owners/me`, () =>
      HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "12" } }),
    ),
  );
  await expect(gatewayFor("owner", transport).save({ phone: "11999999999" })).rejects.toMatchObject({
    retryAfterSeconds: 12,
  });
});
it.each(["owner", "host"] as const)("REQ-ACC-024 pausa %s sem corpo", async (role) => {
  let calls = 0;
  server.use(
    http.post(`${BASE}/${role}s/me/deactivate`, async ({ request }) => {
      calls++;
      expect(await request.text()).toBe("");
      return HttpResponse.json(apiOk({}));
    }),
  );
  await expect(gatewayFor(role, transport).deactivate()).resolves.toBeUndefined();
  expect(calls).toBe(1);
});
