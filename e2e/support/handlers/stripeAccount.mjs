import { randomUUID } from "node:crypto";
import { http } from "msw";
import { ok, fail, sessionUserOf } from "./session.mjs";
import { switchAccounts } from "./switchAccounts.mjs";
const API = "http://localhost:5099/api/v1/hosts/me/stripe-account";
const accounts = new Map();
const noStore = { headers: { "cache-control": "no-store" } };
function access(request) {
  const user = sessionUserOf(request);
  if (!user) return { error: fail(401, "UNAUTHORIZED") };
  if (user.role !== "host") return { error: fail(403, "FORBIDDEN") };
  const account = switchAccounts.find((item) => item.user.id === user.id);
  if (!account || account.scenario === "unverified") return { error: fail(404, "HOST_NOT_FOUND") };
  if (!accounts.has(user.id))
    accounts.set(user.id, {
      status: "not_started",
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      disabledReason: null,
      listingsVisible: false,
      onboardedAt: null,
      syncedAt: null,
    });
  return { user, state: accounts.get(user.id) };
}
function start(result) {
  if (!result.user.isActive) return fail(422, "HOST_STRIPE_ONBOARDING_NOT_ALLOWED");
  if (result.state.status === "rejected") return fail(422, "HOST_STRIPE_ACCOUNT_REJECTED");
  if (result.state.status === "not_started") result.state.status = "in_progress";
  return null;
}
/** Restaura apenas dados sintéticos do Stripe entre jornadas. @example resetStripeAccounts(); */
export function resetStripeAccounts() {
  accounts.clear();
}
/** API simulada por conta: sessão/link efêmeros, só espelho persistido. A sincronização representa aprovação do cadastro fake. @example server.use(...stripeAccountHandlers); */
export const stripeAccountHandlers = [
  http.get(API, ({ request }) => {
    const result = access(request);
    return result.error ?? ok(result.state);
  }),
  http.post(`${API}/onboarding-session`, ({ request }) => {
    const result = access(request);
    if (result.error) return result.error;
    const denied = start(result);
    if (denied) return denied;
    return ok(
      {
        clientSecret: `synthetic_session_${randomUUID()}`,
        publishableKey: "pk_test_synthetic",
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        account: result.state,
      },
      noStore,
    );
  }),
  http.post(`${API}/onboarding-link`, ({ request }) => {
    const result = access(request);
    if (result.error) return result.error;
    const denied = start(result);
    if (denied) return denied;
    return ok(
      {
        url: `https://connect.stripe.com/setup/synthetic/${randomUUID()}`,
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        account: result.state,
      },
      noStore,
    );
  }),
  http.post(`${API}/synchronization`, ({ request }) => {
    const result = access(request);
    if (result.error) return result.error;
    if (result.state.status === "not_started") return fail(404, "HOST_STRIPE_ACCOUNT_NOT_FOUND");
    const now = new Date().toISOString();
    Object.assign(result.state, {
      status: "enabled",
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      listingsVisible: result.user.isActive,
      disabledReason: null,
      syncedAt: now,
      onboardedAt: result.state.onboardedAt ?? now,
    });
    return ok(result.state);
  }),
];
