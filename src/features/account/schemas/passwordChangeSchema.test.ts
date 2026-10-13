import { expect, it } from "vitest";
import { PASSWORD_MAX } from "@/shared/lib/validation/password";
import { passwordChangeSchema } from "./passwordChangeSchema";
it("REQ-ACC-018 senha atual só é exigida e não recebe regra de força ou trim", () => {
  expect(passwordChangeSchema.parse({ currentPassword: "  antiga  ", newPassword: "Abcdef1!" })).toEqual({
    currentPassword: "  antiga  ",
    newPassword: "Abcdef1!",
  });
  expect(passwordChangeSchema.safeParse({ currentPassword: "", newPassword: "Abcdef1!" }).success).toBe(false);
});
it.each(["curta", "abcdef1!", "ABCDEF1!", "Abcdefgh!", "Abcdef12", "A1!" + "a".repeat(PASSWORD_MAX)])(
  "REQ-ACC-018 bloqueia senha nova fora da régua",
  (newPassword) => {
    expect(passwordChangeSchema.safeParse({ currentPassword: "antiga", newPassword }).success).toBe(false);
  },
);
