import { expect, it } from "vitest";
import { payoutStageOf } from "./payoutStageOf";
it("REQ-PAYOUT-013 etapa exportável fica travada sem perfil, sem construir painel", () => {
  expect(payoutStageOf(null)).toMatchObject({
    state: "locked",
    label: "Depois da verificação",
    href: "/host/payments",
  });
});
it.each([
  ["not_started", "current", "Agora"],
  ["in_progress", "current", "Agora"],
  ["restricted", "current", "Agora"],
  ["under_review", "reviewing", "O Stripe está conferindo"],
  ["enabled", "complete", "Concluída"],
  ["rejected", "rejected", "Falar com o suporte"],
] as const)("REQ-PAYOUT-013 etapa %s", (status, state, label) => {
  expect(
    payoutStageOf({
      status,
      payoutsEnabled: status === "enabled",
      listingsVisible: false,
      missing: null,
      syncedAt: null,
    }),
  ).toMatchObject({ state, label });
});
