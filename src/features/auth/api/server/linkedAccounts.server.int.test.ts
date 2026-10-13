import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { prefetchLinkedAccounts } from "./linkedAccounts.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));
it("REQ-SWITCH-003 prefetch autentica no backend e hidrata só dados na chave da conta", async () => {
  let authorized = false;
  let forwarded = false;
  server.use(
    http.get("http://api.test/api/v1/users/me/accounts", ({ request }) => {
      authorized = request.headers.get("authorization") === "Bearer access-sintetico";
      forwarded = request.headers.get("x-forwarded-for") === "203.0.113.10";
      return HttpResponse.json(apiOk([{ role: "host", isActive: true, isCurrent: false }]));
    }),
  );
  const queryClient = createQueryClient();
  await prefetchLinkedAccounts(queryClient, "user-1");
  expect(authorized && forwarded).toBe(true);
  expect(queryClient.getQueryData(accountQueryKey("user-1", "linked-accounts"))).toEqual([
    { role: "host", isActive: true, isCurrent: false },
  ]);
  expect(JSON.stringify(queryClient.getQueryData(accountQueryKey("user-1", "linked-accounts")))).not.toContain(
    "access-sintetico",
  );
  queryClient.clear();
});
it("REQ-SWITCH-003 falha no prefetch não inventa lista vazia nem impede tentativa no cliente", async () => {
  server.use(
    http.get("http://api.test/api/v1/users/me/accounts", () =>
      HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 }),
    ),
  );
  const queryClient = createQueryClient();
  await prefetchLinkedAccounts(queryClient, "user-1");
  expect(queryClient.getQueryData(accountQueryKey("user-1", "linked-accounts"))).toBeUndefined();
  expect(queryClient.getQueryState(accountQueryKey("user-1", "linked-accounts"))?.status).toBe("error");
  queryClient.clear();
});
