import { describe, expect, it } from "vitest";
import { CSRF_HEADER, isAllowedMutation } from "./csrf";

const url = "http://localhost:3000/api/pets";

function request(method: string, headers: Record<string, string> = {}) {
  return new Request(url, { method, headers });
}

describe("isAllowedMutation", () => {
  it("REQ-HTTP-013 GET e HEAD passam sem conferir", () => {
    expect(isAllowedMutation(request("GET"))).toBe(true);
    expect(isAllowedMutation(request("HEAD"))).toBe(true);
  });

  it("REQ-HTTP-013 mutação exige Origin igual e o cabeçalho do app", () => {
    const ok = { origin: "http://localhost:3000", [CSRF_HEADER]: "1" };

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isAllowedMutation(request(method, ok))).toBe(true);
    }
  });

  it("REQ-HTTP-013 sem Origin, Origin de outro site ou sem o cabeçalho → recusa", () => {
    expect(isAllowedMutation(request("POST", { [CSRF_HEADER]: "1" }))).toBe(false);
    expect(isAllowedMutation(request("POST", { origin: "https://evil.example", [CSRF_HEADER]: "1" }))).toBe(false);
    expect(isAllowedMutation(request("POST", { origin: "http://localhost:3000" }))).toBe(false);
    expect(isAllowedMutation(request("POST", { origin: "http://localhost:3000", [CSRF_HEADER]: "0" }))).toBe(false);
  });

  it("REQ-HTTP-013 aceita a origem pública configurada (app atrás de proxy)", () => {
    const behindProxy = new Request("http://10.0.0.4:3000/api/pets", {
      method: "POST",
      headers: { origin: "https://pethost.app", [CSRF_HEADER]: "1" },
    });

    expect(isAllowedMutation(behindProxy)).toBe(false);
    expect(isAllowedMutation(behindProxy, { allowedOrigins: ["https://pethost.app"] })).toBe(true);
  });
});
