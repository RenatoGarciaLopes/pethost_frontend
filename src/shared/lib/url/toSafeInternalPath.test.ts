import { describe, expect, it } from "vitest";
import { toSafeInternalPath } from "./toSafeInternalPath";

describe("toSafeInternalPath", () => {
  it("REQ-HTTP-016 aceita caminho interno com query e hash", () => {
    expect(toSafeInternalPath("/pets/1?tab=fotos#topo", "/")).toBe("/pets/1?tab=fotos#topo");
  });

  it.each([
    ["https://evil.example/x"],
    ["//evil.example"],
    ["/\\evil.example"],
    ["\\\\evil.example"],
    ["javascript:alert(1)"],
    ["pets"],
    ["/api/auth/sessions/refresh"],
    [""],
    [null],
    [undefined],
  ])("REQ-HTTP-016 recusa %s e devolve o padrão", (value) => {
    expect(toSafeInternalPath(value, "/inicio")).toBe("/inicio");
  });

  it("REQ-HTTP-016 recusa caracteres de controle (quebra de cabeçalho)", () => {
    expect(toSafeInternalPath("/ok\r\nSet-Cookie: x=1", "/")).toBe("/");
  });
});
