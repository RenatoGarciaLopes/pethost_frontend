import { expect, it } from "vitest";
import { stripeAccountSchema } from "./contracts";
import { toPayoutAccount } from "./mappers";
const dto = {
  status: "not_started",
  detailsSubmitted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  listingsVisible: false,
};
it.each(["not_started", "in_progress", "under_review", "restricted", "enabled", "rejected"])(
  "REQ-PAYOUT-008 estreita status %s e projeta só dados de tela",
  (status) => {
    expect(toPayoutAccount(stripeAccountSchema.parse({ ...dto, status }))).toEqual({
      status,
      payoutsEnabled: false,
      listingsVisible: false,
      missing: null,
      syncedAt: null,
    });
  },
);
it("REQ-PAYOUT-008 situação desconhecida falha no contrato", () => {
  expect(stripeAccountSchema.safeParse({ ...dto, status: "future" }).success).toBe(false);
});
