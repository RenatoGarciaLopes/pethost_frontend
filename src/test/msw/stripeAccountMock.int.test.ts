import { afterEach, expect, it } from "vitest";
import { server } from "./server";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import {
  stripeAccountHandlers,
  resetStripeAccounts,
  seedStripeAccount,
} from "../../../e2e/support/handlers/stripeAccount.mjs";
import {
  GetApiV1HostsMeStripeAccountResponse,
  PostApiV1HostsMeStripeAccountOnboardingSessionResponse,
} from "@/shared/api/generated/host-stripe-account/host-stripe-account.zod";
const API = "http://localhost:5099/api/v1/hosts/me/stripe-account";
afterEach(resetStripeAccounts);
function call(role = "host", scenario = "both") {
  server.use(...stripeAccountHandlers);
  const { accessToken } = issueSession(
    switchAccounts.find((item) => item.user.role === role && item.scenario === scenario)!.user,
  );
  return (suffix = "", method = "GET") =>
    fetch(`${API}${suffix}`, { method, headers: { authorization: `Bearer ${accessToken}` } });
}
it("REQ-PAYOUT-001/002 mock exige host verificado", async () => {
  server.use(...stripeAccountHandlers);
  expect((await fetch(API)).status).toBe(401);
  expect((await call("owner")()).status).toBe(403);
  expect((await call("host", "unverified")()).status).toBe(404);
});
it("REQ-PAYOUT-004/006/007 mock emite sessões distintas e sincroniza após cadastro", async () => {
  const host = call();
  const initial = await host();
  expect(GetApiV1HostsMeStripeAccountResponse.safeParse(await initial.json()).success).toBe(true);
  expect((await host("/synchronization", "POST")).status).toBe(404);
  const first = await host("/onboarding-session", "POST");
  expect(first.headers.get("cache-control")).toBe("no-store");
  const one = await first.json();
  const two = await (await host("/onboarding-session", "POST")).json();
  expect(PostApiV1HostsMeStripeAccountOnboardingSessionResponse.safeParse(one).success).toBe(true);
  expect(one.data.clientSecret).not.toBe(two.data.clientSecret);
  expect((await (await host("/synchronization", "POST")).json()).data.payoutsEnabled).toBe(true);
  resetStripeAccounts();
  expect((await (await host()).json()).data.status).toBe("not_started");
});
it("REQ-PAYOUT-010 mock oferece link hospedado efêmero sem confundir contas", async () => {
  const host = call();
  const response = await host("/onboarding-link", "POST");
  const body = await response.json();
  expect(body.data.url).toMatch(/^https:\/\/connect.stripe.com\/setup\//);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await call("host", "paused")("/onboarding-session", "POST")).status).toBe(422);
});
it("REQ-PAYOUT-008 mock semeia restricted/enabled e rejeita conta sem verificação", async () => {
  const verifiedHost = switchAccounts.find((item) => item.scenario === "both" && item.user.role === "host")!;
  const unverifiedHost = switchAccounts.find((item) => item.scenario === "unverified" && item.user.role === "host")!;
  expect(seedStripeAccount(verifiedHost.user.id, "restricted")).toBe(true);
  const host = call();
  const restricted = await (await host()).json();
  expect(restricted.data).toMatchObject({ status: "restricted", disabledReason: "requirements.pending_verification" });

  expect(seedStripeAccount(verifiedHost.user.id, "enabled")).toBe(true);
  const enabled = await (await host()).json();
  expect(enabled.data).toMatchObject({ status: "enabled", payoutsEnabled: true, listingsVisible: true });
  expect(seedStripeAccount(unverifiedHost.user.id, "enabled")).toBe(false);
});
