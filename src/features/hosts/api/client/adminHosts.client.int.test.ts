import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { adminHostFixture } from "@/test/fixtures/adminAccounts";
import { createBffClient } from "@/shared/api/client/bffClient";
import {
  listHosts,
  getHost,
  suspendHost,
  liftHostSuspension,
  releaseHostIdentity,
  resetHostStripeAccount,
} from "./adminHosts.client";
it("REQ-AACC-014/015/016 filtro Stripe vai à API e reset envia motivo aparado", async () => {
  const host = adminHostFixture({ stripeStatus: "rejected" });
  const transport = createBffClient({ baseUrl: "http://accounts.test/api" });
  server.use(
    http.get("http://accounts.test/api/hosts", ({ request }) => {
      expect(new URL(request.url).searchParams.get("stripeStatus")).toBe("rejected");
      return HttpResponse.json(apiOk([host]));
    }),
    http.post("http://accounts.test/api/hosts/:id/stripe-account-reset", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Erro nos dados" });
      return HttpResponse.json(apiOk({ ...host, stripeStatus: "not_started", stripeConnected: false }));
    }),
  );
  expect(await listHosts("rejected", transport)).toHaveLength(1);
  expect((await resetHostStripeAccount(host.id, { reason: " Erro nos dados " }, transport)).stripeStatus).toBe(
    "not_started",
  );
});
it("REQ-AACC-005/006/007 anfitrião tem ações de suspensão e liberação pelo hostId", async () => {
  const host = adminHostFixture();
  const transport = createBffClient({ baseUrl: "http://accounts.test/api" });
  server.use(
    http.get("http://accounts.test/api/hosts/:id", () => HttpResponse.json(apiOk(host))),
    http.post("http://accounts.test/api/hosts/:id/suspension", () => HttpResponse.json(apiOk(host))),
    http.delete("http://accounts.test/api/hosts/:id/suspension", async ({ request }) => {
      expect(await request.text()).toBe("");
      return HttpResponse.json(apiOk(host));
    }),
    http.post("http://accounts.test/api/hosts/:id/identity-release", () => HttpResponse.json(apiOk(host))),
  );
  expect((await getHost(host.id, transport)).id).toBe(host.id);
  await suspendHost(host.id, { reason: "Conferido" }, transport);
  await liftHostSuspension(host.id, transport);
  await releaseHostIdentity(host.id, { reason: "Conferido" }, transport);
});
it("REQ-AACC-016 reset inválido propaga 422 sem repetir POST", async () => {
  let calls = 0;
  server.use(
    http.post("http://accounts.test/api/hosts/:id/stripe-account-reset", () => {
      calls++;
      return HttpResponse.json(apiFail("HOST_STRIPE_ACCOUNT_NOT_REJECTED"), { status: 422 });
    }),
  );
  await expect(
    resetHostStripeAccount(
      adminHostFixture().id,
      { reason: "Conferido" },
      createBffClient({ baseUrl: "http://accounts.test/api" }),
    ),
  ).rejects.toMatchObject({ code: "HOST_STRIPE_ACCOUNT_NOT_REJECTED" });
  expect(calls).toBe(1);
});
