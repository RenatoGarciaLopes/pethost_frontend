import { expect, it } from "vitest";
import { accountLabel } from "./accountLabel";
it.each([
  ["owner", "Conta de tutor"],
  ["host", "Conta de anfitrião"],
  ["admin", "Conta de admin"],
] as const)("REQ-SHELL-003 conta de %s usa forma neutra %s", (role, label) => {
  expect(accountLabel(role)).toBe(label);
});
