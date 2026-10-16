import { expect, it } from "vitest";
import { payoutRequirementOf } from "./payoutRequirementOf";
it.each([
  [null, null],
  [undefined, null],
  ["", null],
  ["requirements.past_due", "confirm"],
  ["requirements.pending_verification", "confirm"],
  ["requirements.future", "complete"],
  ["rejected.fraud", "other"],
  ["other.raw", "other"],
])("REQ-PAYOUT-008 motivo %s nunca vira texto bruto", (value, expected) => {
  expect(payoutRequirementOf(value)).toBe(expected);
});
