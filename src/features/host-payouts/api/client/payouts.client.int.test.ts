import { createBffClient } from "@/shared/api/client/bffClient";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { apiOk } from "@/test/fixtures/session";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { server } from "@/test/msw/server";
import { createOnboardingSession, createHostedOnboardingLink, synchronizePayoutAccount } from "./payouts.client";
const transport = createBffClient({ baseUrl: "http://localhost/api" });
it("REQ-PAYOUT-004/006 cada sessão usa POST fresco, sem corpo e com CSRF", async () => {
  let calls = 0;
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-session", async ({ request }) => {
      expect(await request.text()).toBe("");
      expect(request.headers.get("x-pethost-request")).toBe("1");
      return HttpResponse.json(
        apiOk({
          clientSecret: `synthetic-${++calls}`,
          publishableKey: "pk_test_synthetic",
          expiresAt: Math.floor(Date.now() / 1000) + 600,
          account: payoutAccountDto(),
        }),
      );
    }),
  );
  expect((await createOnboardingSession(transport)).clientSecret).toBe("synthetic-1");
  expect((await createOnboardingSession(transport)).clientSecret).toBe("synthetic-2");
});
it("REQ-PAYOUT-007/010 valida sincronização e URL hospedada", async () => {
  server.use(
    http.post("*/api/hosts/me/stripe-account/synchronization", () =>
      HttpResponse.json(apiOk(payoutAccountDto({ status: "enabled", payoutsEnabled: true }))),
    ),
    http.post("*/api/hosts/me/stripe-account/onboarding-link", () =>
      HttpResponse.json(
        apiOk({
          url: "https://connect.stripe.com/setup/synthetic",
          expiresAt: 2000000000,
          account: payoutAccountDto(),
        }),
      ),
    ),
  );
  expect((await synchronizePayoutAccount(transport)).status).toBe("enabled");
  expect((await createHostedOnboardingLink(transport)).url).toBe("https://connect.stripe.com/setup/synthetic");
  server.use(
    http.post("*/api/hosts/me/stripe-account/onboarding-link", () =>
      HttpResponse.json(apiOk({ url: "https://unsafe.test/path", expiresAt: 2000000000, account: payoutAccountDto() })),
    ),
  );
  await expect(createHostedOnboardingLink(transport)).rejects.toMatchObject({ code: "CONTRACT_MISMATCH" });
});
