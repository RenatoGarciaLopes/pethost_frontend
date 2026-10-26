import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { onboardingSessionSchema, onboardingLinkSchema, stripeAccountSchema } from "../contracts";
/** POST fresco, sem retry automático. Não cachear o retorno. @example await createOnboardingSession(); */
export function createOnboardingSession(transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: "/hosts/me/stripe-account/onboarding-session" },
    onboardingSessionSchema,
  );
}
/** URL de uso único, entregue diretamente à navegação e nunca guardada. @example await createHostedOnboardingLink(); */
export function createHostedOnboardingLink(transport: HttpTransport = bffClient) {
  return transport.request({ method: "POST", path: "/hosts/me/stripe-account/onboarding-link" }, onboardingLinkSchema);
}
/** Relê situação no Stripe; não assume que sair do cadastro significa aprovação. @example await synchronizePayoutAccount(); */
export function synchronizePayoutAccount(transport: HttpTransport = bffClient) {
  return transport.request({ method: "POST", path: "/hosts/me/stripe-account/synchronization" }, stripeAccountSchema);
}
