import { expect, it } from "vitest";
import { adminHostFixture } from "@/test/fixtures/adminAccounts";
import { adminHostSchema, stripeStatusSchema } from "./contracts";
it("REQ-AACC-002/004/014 anfitrião mantém identidade liberada e aceita seis status Stripe", () => {
  for (const stripeStatus of stripeStatusSchema.options)
    expect(adminHostFixture({ stripeStatus }).stripeStatus).toBe(stripeStatus);
  expect(adminHostFixture({ identityReleasedAt: "2026-10-02T12:00:00Z" }).cpf).toBe("11144477735");
  expect(adminHostSchema.safeParse({ ...adminHostFixture(), stripeStatus: "unknown" }).success).toBe(false);
});
