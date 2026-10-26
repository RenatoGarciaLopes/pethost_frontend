import { describe, expect, it } from "vitest";
import { isStrongPassword, PASSWORD_MAX, PASSWORD_RULES } from "./password";

describe("PASSWORD_RULES", () => {
  it.each([
    ["length", "Abcdef1!", "Abc1!"],
    ["uppercase", "aÉ", "abc"],
    ["lowercase", "Aç", "ABC"],
    ["digit", "a1", "abc"],
    ["special", "a!", "a b"],
  ] as const)("REQ-OREG-003 regra %s isolada", (rule, passes, fails) => {
    expect(PASSWORD_RULES[rule](passes)).toBe(true);
    expect(PASSWORD_RULES[rule](fails)).toBe(false);
  });

  it("REQ-OREG-003 tamanho: 8 e 128 passam, 7 e 129 não", () => {
    expect(PASSWORD_RULES.length("a".repeat(8))).toBe(true);
    expect(PASSWORD_RULES.length("a".repeat(7))).toBe(false);
    expect(PASSWORD_RULES.length("a".repeat(PASSWORD_MAX))).toBe(true);
    expect(PASSWORD_RULES.length("a".repeat(PASSWORD_MAX + 1))).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("REQ-OREG-003 exige as cinco regras", () => {
    expect(isStrongPassword("Abcdef1!")).toBe(true);
    expect(isStrongPassword("abcdef1!")).toBe(false);
    expect(isStrongPassword("Abcdefg!")).toBe(false);
    expect(isStrongPassword("Abcdef1 ")).toBe(false);
  });
});
