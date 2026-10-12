import { describe, expect, it } from "vitest";
import { readRoleHint, readUnverifiedClaims } from "./jwtClaims";

const token = (claims: object) =>
  `h.${btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.s`;

describe("readUnverifiedClaims", () => {
  it("REQ-SHELL-009 lê o payload base64url, inclusive acentos", () => {
    const encoded = `h.${Buffer.from(JSON.stringify({ name: "Conceição", exp: 1 })).toString("base64url")}.s`;

    expect(readUnverifiedClaims(encoded)).toEqual({ name: "Conceição", exp: 1 });
  });

  it("REQ-SHELL-009 token ilegível devolve undefined", () => {
    expect(readUnverifiedClaims("nope")).toBeUndefined();
    expect(readUnverifiedClaims("a.###.c")).toBeUndefined();
    expect(readUnverifiedClaims(`a.${btoa("[1]")}.c`)).toBeUndefined();
  });
});

describe("readRoleHint", () => {
  it("REQ-SHELL-009 devolve só papéis conhecidos", () => {
    expect(readRoleHint(token({ role: "host" }))).toBe("host");
    expect(readRoleHint(token({ role: "root" }))).toBeUndefined();
    expect(readRoleHint(undefined)).toBeUndefined();
  });
});
