import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { getLinkedAccounts } from "./linkedAccounts.client";

const BASE = "http://bff.test/api";
it("REQ-SWITCH-003 lista contas pelo BFF e descarta admin e papéis desconhecidos", async () => {
  server.use(
    http.get(`${BASE}/users/me/accounts`, () =>
      HttpResponse.json(
        apiOk([
          { role: "owner", isActive: true, isCurrent: true },
          { role: "host", isActive: false, isCurrent: false },
          { role: "admin", isActive: true, isCurrent: false },
          { role: "novo", isActive: true, isCurrent: false },
        ]),
      ),
    ),
  );
  await expect(getLinkedAccounts(createBffClient({ baseUrl: BASE }))).resolves.toEqual([
    { role: "owner", isActive: true, isCurrent: true },
    { role: "host", isActive: false, isCurrent: false },
  ]);
});
it.each([null, [{ role: "host", isActive: "sim", isCurrent: false }]])(
  "REQ-SWITCH-003 rejeita resposta fora do contrato: %j",
  async (data) => {
    server.use(http.get(`${BASE}/users/me/accounts`, () => HttpResponse.json(apiOk(data))));
    await expect(getLinkedAccounts(createBffClient({ baseUrl: BASE }))).rejects.toMatchObject({
      code: "CONTRACT_MISMATCH",
    });
  },
);
it("REQ-SWITCH-008 propaga sessão vencida", async () => {
  server.use(
    http.get(`${BASE}/users/me/accounts`, () => HttpResponse.json(apiFail("SESSION_EXPIRED"), { status: 401 })),
  );
  await expect(getLinkedAccounts(createBffClient({ baseUrl: BASE }))).rejects.toMatchObject({
    code: "SESSION_EXPIRED",
  });
});
