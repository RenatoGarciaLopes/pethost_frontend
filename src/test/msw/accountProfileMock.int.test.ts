import { afterEach, expect, it } from "vitest";
import { accountProfileHandlers, resetAccountProfiles } from "../../../e2e/support/handlers/accountProfile.mjs";
import { issueSession, sessionHandlers } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { GetApiV1OwnersMeResponse } from "@/shared/api/generated/owners/owners.zod";
import { GetApiV1HostsMeResponse } from "@/shared/api/generated/hosts/hosts.zod";
import { TAKEN_CPF } from "../../../e2e/support/handlers/owners.mjs";
import { server } from "./server";
const API = "http://localhost:5099/api/v1";
const passwords = switchAccounts.map((account) => account.password);
afterEach(() =>
  switchAccounts.forEach((account, index) => {
    account.password = passwords[index]!;
    account.user.isActive = account.scenario !== "paused" || account.user.role !== "host";
  }),
);
function setup(scenario: string, role: "owner" | "host" = "owner") {
  server.use(...accountProfileHandlers, ...sessionHandlers);
  const account = switchAccounts.find((item) => item.scenario === scenario && item.user.role === role)!;
  return { account, session: issueSession({ ...account.user }) };
}
function call(access: string, path: string, method = "GET", body?: unknown) {
  return fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${access}`,
      ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
}
it("REQ-ACC-004/007 tutor pago mantém contato livre e trava CPF e nascimento", async () => {
  const { session } = setup("both");
  const response = await call(session.accessToken, "/owners/me");
  expect(GetApiV1OwnersMeResponse.safeParse(await response.json()).success).toBe(true);
  const patch = await call(session.accessToken, "/owners/me", "PATCH", { phone: "11999999999" });
  expect((await patch.json()).data.user.phone).toBe("11999999999");
  for (const [body, code] of [
    [{ cpf: "16899535009" }, "OWNER_CPF_LOCKED"],
    [{ birthDate: "1990-05-04" }, "OWNER_BIRTH_DATE_LOCKED"],
  ] as const) {
    const error = await call(session.accessToken, "/owners/me", "PATCH", {
      ...body,
      currentPassword: "senha-de-teste",
    });
    expect(error.status).toBe(422);
    expect((await error.json()).error.code).toBe(code);
  }
});
it("REQ-ACC-005/008 tutor sem pagamento exige senha e recusa CPF de outra conta", async () => {
  const { session } = setup("single");
  const error = await call(session.accessToken, "/owners/me", "PATCH", {
    birthDate: "1990-05-04",
    currentPassword: "errada",
  });
  expect(error.status).toBe(400);
  expect((await error.json()).error.details).toEqual([
    {
      field: "currentPassword",
      messages: ["Confere sua senha atual."],
      errors: [{ code: "AUTH_CURRENT_PASSWORD_INCORRECT" }],
    },
  ]);
  const conflict = await call(session.accessToken, "/owners/me", "PATCH", {
    cpf: TAKEN_CPF,
    currentPassword: "senha-de-teste",
  });
  expect(conflict.status).toBe(409);
  expect((await conflict.json()).error.code).toBe("OWNER_CPF_ALREADY_REGISTERED");
  const known = await call(session.accessToken, "/owners/me", "PATCH", {
    cpf: "52998224725",
    currentPassword: "senha-de-teste",
  });
  expect(known.status).toBe(409);
  expect(
    (
      await call(session.accessToken, "/owners/me", "PATCH", {
        birthDate: "1990-05-04",
        currentPassword: "senha-de-teste",
      })
    ).status,
  ).toBe(200);
});
it("REQ-ACC-009/010 anfitrião PF aceita contato e identidade igual, mas recusa identidade nova", async () => {
  const { session } = setup("both", "host");
  const get = await call(session.accessToken, "/hosts/me");
  const json = await get.json();
  expect(GetApiV1HostsMeResponse.safeParse(json).success).toBe(true);
  expect(
    (await call(session.accessToken, "/hosts/me", "PATCH", { fullName: json.data.user.fullName, phone: "11999999999" }))
      .status,
  ).toBe(200);
  const error = await call(session.accessToken, "/hosts/me", "PATCH", { fullName: "Outra pessoa" });
  expect(error.status).toBe(422);
  expect((await error.json()).error.code).toBe("HOST_IDENTITY_LOCKED");
  expect((await call(session.accessToken, "/hosts/me", "PATCH", { tradeName: "Empresa" })).status).toBe(422);
});
it("REQ-ACC-011 conta sem aprovação devolve HOST_NOT_FOUND e /users/me continua disponível", async () => {
  const { session } = setup("unverified", "host");
  const response = await call(session.accessToken, "/hosts/me");
  expect(response.status).toBe(404);
  expect((await response.json()).error.code).toBe("HOST_NOT_FOUND");
  expect((await call(session.accessToken, "/users/me")).status).toBe(200);
});
it.each(["owner", "host"] as const)("REQ-ACC-015/016 multipart %s muda foto e DELETE é idempotente", async (role) => {
  const { session } = setup("both", role);
  const body = new FormData();
  body.append("file", new File(["foto"], "foto.png", { type: "image/png" }));
  const response = await call(session.accessToken, `/${role}s/me/avatar`, "PUT", body);
  expect(response.status).toBe(200);
  expect((await response.json()).data.user.avatarUrl).toMatch(/^https:\/\/images\.example\.test\//);
  for (let attempt = 0; attempt < 2; attempt++) {
    const remove = await call(session.accessToken, `/${role}s/me/avatar`, "DELETE");
    expect((await remove.json()).data.user.avatarUrl).toBeNull();
  }
});
it("REQ-ACC-017 mock devolve erro file para foto inválida e 413 para corpo grande", async () => {
  const { session } = setup("both");
  const invalid = new FormData();
  invalid.append("file", new File(["texto"], "foto.txt", { type: "text/plain" }));
  const response = await call(session.accessToken, "/owners/me/avatar", "PUT", invalid);
  expect(response.status).toBe(400);
  expect((await response.json()).error.details[0].field).toBe("file");
  const big = new FormData();
  big.append("file", new File([new Uint8Array(8 * 1024 * 1024 + 1)], "foto.png", { type: "image/png" }));
  expect((await call(session.accessToken, "/owners/me/avatar", "PUT", big)).status).toBe(413);
});
it.each(["owner", "host"] as const)("REQ-ACC-024 pausar %s revoga todas as sessões só desta conta", async (role) => {
  const { account, session } = setup("both", role);
  const another = issueSession({ ...account.user });
  const otherRole = switchAccounts.find((item) => item.scenario === "both" && item.user.role !== role)!;
  const other = issueSession({ ...otherRole.user });
  expect((await call(session.accessToken, `/${role}s/me/deactivate`, "POST")).status).toBe(200);
  expect((await call(session.accessToken, "/users/me")).status).toBe(401);
  expect((await call(another.accessToken, "/users/me")).status).toBe(401);
  const refresh = await fetch(`${API}/auth/sessions/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: another.refreshToken }),
  });
  expect(refresh.status).toBe(401);
  expect((await call(other.accessToken, "/users/me")).status).toBe(200);
});
it("REQ-ACC-019/020 senha errada não revoga e senha certa abre sessão nova", async () => {
  const { account, session } = setup("single");
  const error = await call(session.accessToken, "/users/me/password", "POST", {
    currentPassword: "errada",
    newPassword: "Abcdef1!",
  });
  expect(error.status).toBe(400);
  expect((await error.json()).error.details[0].field).toBe("currentPassword");
  expect((await call(session.accessToken, "/users/me")).status).toBe(200);
  const response = await call(session.accessToken, "/users/me/password", "POST", {
    currentPassword: account.password,
    newPassword: "Abcdef1!",
  });
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(data.user.id).toBe(account.user.id);
  expect((await call(session.accessToken, "/users/me")).status).toBe(401);
  expect((await call(data.accessToken, "/users/me")).status).toBe(200);
});
it("REQ-ACC-001 mock exige sessão para operações de conta", async () => {
  server.use(...accountProfileHandlers);
  expect((await call("inválido", "/owners/me")).status).toBe(401);
  expect((await call("inválido", "/hosts/me/deactivate", "POST")).status).toBe(401);
});

it("REQ-ACC-019/024 reset do mock restaura senha, perfil e estado ativo e invalida sessões anteriores", async () => {
  const { account, session } = setup("single");
  await call(session.accessToken, "/owners/me", "PATCH", { phone: "11999999999" });
  account.password = "Alterada#123";
  account.user.isActive = false;
  resetAccountProfiles();
  expect(account.password).toBe("senha-de-teste");
  expect(account.user.isActive).toBe(true);
  expect((await call(session.accessToken, "/owners/me")).status).toBe(401);
  const next = issueSession(account.user);
  expect((await (await call(next.accessToken, "/owners/me")).json()).data.user.phone).toBe("11987654321");
});
