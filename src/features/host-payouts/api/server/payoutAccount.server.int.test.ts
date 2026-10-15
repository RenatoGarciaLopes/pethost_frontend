import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { server } from "@/test/msw/server";
import { payoutQueries } from "../queries";
import { prefetchPayoutAccount } from "./payoutAccount.server";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic-access" }) }),
  headers: async () => new Headers(),
}));
it("REQ-PAYOUT-001 prefetch autenticado hidrata situação e isola conta", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/stripe-account", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer synthetic-access");
      return HttpResponse.json(apiOk(payoutAccountDto()));
    }),
  );
  const client = createQueryClient();
  await prefetchPayoutAccount(client, "host-1");
  expect(client.getQueryData(payoutQueries.account("host-1").queryKey)?.status).toBe("not_started");
  expect(client.getQueryData(payoutQueries.account("host-2").queryKey)).toBeUndefined();
  client.clear();
});
it("REQ-PAYOUT-002 HOST_NOT_FOUND vira estado null hidratável, sem erro de query", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/stripe-account", () =>
      HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 }),
    ),
  );
  const client = createQueryClient();
  await prefetchPayoutAccount(client, "pending");
  expect(client.getQueryData(payoutQueries.account("pending").queryKey)).toBeNull();
  expect(client.getQueryState(payoutQueries.account("pending").queryKey)?.status).toBe("success");
  client.clear();
});
it("REQ-PAYOUT-001 erro transitório fica no cache, sem inventar conta", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/stripe-account", () =>
      HttpResponse.json(apiFail("HOST_STRIPE_UNAVAILABLE"), { status: 503 }),
    ),
  );
  const client = createQueryClient();
  await prefetchPayoutAccount(client, "unavailable");
  expect(client.getQueryState(payoutQueries.account("unavailable").queryKey)?.status).toBe("error");
  client.clear();
});
