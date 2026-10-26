import { expect, it } from "vitest";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { accountSwitchHandlers } from "../../../e2e/support/handlers/accountSwitch.mjs";
import { issueSession, sessionHandlers } from "../../../e2e/support/handlers/session.mjs";
import { server } from "./server";

const API = "http://localhost:5099/api/v1";
function session(scenario: string) {
  const account = switchAccounts.find((item) => item.scenario === scenario && item.user.role === "owner")!;
  return issueSession(account.user);
}
function setup() {
  server.use(...accountSwitchHandlers, ...sessionHandlers);
}
async function switchTo(accessToken: string, role: string, password: string) {
  return fetch(`${API}/auth/sessions/switch`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ role, password }),
  });
}
it.each(["both", "single", "paused"])(
  "REQ-SWITCH-003 mock lista cenário %s ligado ao usuário autenticado",
  async (scenario) => {
    setup();
    const current = session(scenario);
    const response = await fetch(`${API}/users/me/accounts`, {
      headers: { authorization: `Bearer ${current.accessToken}` },
    });
    const { data } = await response.json();
    expect(data).toEqual(
      scenario === "single"
        ? [{ role: "owner", isActive: true, isCurrent: true }]
        : [
            { role: "owner", isActive: true, isCurrent: true },
            { role: "host", isActive: scenario !== "paused", isCurrent: false },
          ],
    );
  },
);
it("REQ-SWITCH-005 mock troca para a conta de destino e refresh mantém o papel novo", async () => {
  setup();
  const current = session("both");
  const response = await switchTo(current.accessToken, "host", "senha-do-host");
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(data.user.role).toBe("host");
  expect(data.user.id).not.toBe(current.user.id);
  const me = await fetch(`${API}/users/me`, { headers: { authorization: `Bearer ${data.accessToken}` } });
  expect((await me.json()).data.role).toBe("host");
  const refresh = await fetch(`${API}/auth/sessions/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: data.refreshToken }),
  });
  expect((await refresh.json()).data.user.role).toBe("host");
  const accounts = await fetch(`${API}/users/me/accounts`, {
    headers: { authorization: `Bearer ${data.accessToken}` },
  });
  expect((await accounts.json()).data).toContainEqual({ role: "host", isActive: true, isCurrent: true });
});
it("REQ-SWITCH-007 mock devolve o mesmo erro para senha errada, papel atual, ausência e pausa", async () => {
  setup();
  const cases = [
    ["both", "host", "errada"],
    ["both", "owner", "senha-de-teste"],
    ["single", "host", "senha-do-host"],
    ["paused", "host", "senha-do-host"],
  ];
  for (const [scenario, role, password] of cases) {
    const response = await switchTo(session(scenario!).accessToken, role!, password!);
    expect(response.status).toBe(404);
    expect((await response.json()).error).toEqual({
      code: "AUTH_LINKED_ACCOUNT_NOT_FOUND",
      message: "AUTH_LINKED_ACCOUNT_NOT_FOUND",
    });
  }
});
it("REQ-SWITCH-001 mock exige autenticação e valida papel e senha", async () => {
  setup();
  expect((await fetch(`${API}/users/me/accounts`)).status).toBe(401);
  expect((await switchTo("invalido", "host", "senha-do-host")).status).toBe(401);
  const current = session("both");
  expect((await switchTo(current.accessToken, "admin", "senha-do-host")).status).toBe(400);
  expect((await switchTo(current.accessToken, "host", "")).status).toBe(400);
});
it("REQ-SWITCH-005 fixtures de troca entram pelo login existente sem mudar a conta demo", async () => {
  setup();
  for (const scenario of ["both", "single", "paused"]) {
    const account = switchAccounts.find((item) => item.scenario === scenario && item.user.role === "owner")!;
    const response = await fetch(`${API}/auth/sessions/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: account.user.email, role: "owner", password: account.password }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.user).toEqual(account.user);
  }
});
