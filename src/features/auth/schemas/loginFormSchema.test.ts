import { describe, expect, it } from "vitest";
import { authCopy } from "../lib/authCopy";
import { loginFormSchema } from "./loginFormSchema";

describe("loginFormSchema", () => {
  it("REQ-AUTH-003 normaliza email sem alterar senha nem exigir força", () => {
    expect(loginFormSchema.parse({ email: " A@EXEMPLO.COM ", password: " x ", role: "owner" })).toEqual({
      email: "a@exemplo.com",
      password: " x ",
      role: "owner",
    });
  });
  it.each([
    ["", "x", "email", authCopy.fieldErrors.emailMissing],
    ["invalido", "x", "email", authCopy.fieldErrors.emailInvalid],
    ["a@b.com", "", "password", authCopy.fieldErrors.passwordMissing],
    ["a@b.com", "x".repeat(129), "password", authCopy.fieldErrors.passwordTooLong],
  ])("REQ-AUTH-003 rejeita valores inválidos: %s / %s", (email, password, field, message) => {
    const result = loginFormSchema.safeParse({ email, password, role: "host" });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(expect.objectContaining({ path: [field], message }));
  });
  it("aceita o limite de 128 caracteres e rejeita papel desconhecido", () => {
    expect(loginFormSchema.safeParse({ email: "a@b.com", password: "x".repeat(128), role: "admin" }).success).toBe(
      true,
    );
    expect(loginFormSchema.safeParse({ email: "a@b.com", password: "x", role: "guest" }).success).toBe(false);
  });
  it("REQ-AUTH-010 pluraliza a contagem", () => {
    expect(authCopy.countdown(1)).toBe("Dá pra tentar de novo em 1 segundo.");
    expect(authCopy.countdown(2)).toBe("Dá pra tentar de novo em 2 segundos.");
  });
});
