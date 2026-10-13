import { describe, expect, it } from "vitest";
import { authCopy } from "../lib/authCopy";
import { forgotPasswordSchema } from "./forgotPasswordSchema";

describe("forgotPasswordSchema", () => {
  it.each(["owner", "host", "admin"])("REQ-PWD-001 aceita o papel %s e normaliza o e-mail", (role) => {
    expect(forgotPasswordSchema.parse({ role, email: "  PESSOA@EXEMPLO.TEST  " })).toEqual({
      role,
      email: "pessoa@exemplo.test",
    });
  });
  it.each([
    ["   ", authCopy.fieldErrors.emailMissing],
    ["incompleto", authCopy.fieldErrors.emailInvalid],
  ])("REQ-PWD-002 rejeita e-mail %s", (email, message) => {
    const result = forgotPasswordSchema.safeParse({ role: "owner", email });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe(message);
  });
  it("REQ-PWD-001 recusa papéis inexistentes", () => {
    expect(forgotPasswordSchema.safeParse({ role: "visitor", email: "pessoa@exemplo.test" }).success).toBe(false);
  });
});
