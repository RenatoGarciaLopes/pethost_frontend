import { describe, expect, it } from "vitest";
import { PASSWORD_MAX } from "@/shared/lib/validation/password";
import { resetPasswordSchema } from "./resetPasswordSchema";

describe("resetPasswordSchema", () => {
  it.each(["Abcdef1!", "Ábcdef١!", `Aa1!${"b".repeat(PASSWORD_MAX - 4)}`])(
    "REQ-PWD-007 aceita senha forte sem normalizar: %s",
    (newPassword) => {
      expect(resetPasswordSchema.parse({ newPassword })).toEqual({ newPassword });
    },
  );
  it.each(["", "Ab1!", "abcdef1!", "ABCDEF1!", "Abcdefg!", "Abcdef12", "Abcdef1 "])(
    "REQ-PWD-007 rejeita regra ausente em %s",
    (newPassword) => {
      const result = resetPasswordSchema.safeParse({ newPassword });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe("A senha ainda não cumpre a régua.");
    },
  );
  it("REQ-PWD-007 rejeita senha acima do limite", () => {
    expect(resetPasswordSchema.safeParse({ newPassword: `Aa1!${"b".repeat(PASSWORD_MAX - 3)}` }).success).toBe(false);
  });
});
