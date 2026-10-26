import { describe, expect, it } from "vitest";
import { readSecretFromUrl, withoutSecret } from "./readSecretFromUrl";

describe("REQ-PWD-005 segredo no link", () => {
  it.each([
    ["#token=fragmento", "?token=query", "fragmento"],
    ["#outro=1", "?token=a%2Bb%2Fc%3D", "a+b/c="],
    ["#token=", "?token=query", null],
    ["", "?token=", null],
    ["#secao", "?role=host", null],
    ["#token=primeiro&token=segundo", "", "primeiro"],
  ])("lê e decodifica %s com query %s", (hash, search, expected) => {
    expect(readSecretFromUrl("token", { hash, search })).toBe(expected);
  });

  it("REQ-PWD-013 remove todas as cópias preservando os outros parâmetros", () => {
    expect(
      withoutSecret("token", {
        pathname: "/reset-password",
        search: "?role=host&token=a&token=b",
        hash: "#token=c&passo=2",
      }),
    ).toBe("/reset-password?role=host#passo=2");
  });
  it("remove os separadores vazios e mantém âncora sem segredo intacta", () => {
    expect(withoutSecret("token", { pathname: "/reset-password", search: "?token=a", hash: "#token=b" })).toBe(
      "/reset-password",
    );
    expect(withoutSecret("token", { pathname: "/reset-password", search: "?role=host", hash: "#secao" })).toBe(
      "/reset-password?role=host#secao",
    );
  });
  it("aceita um nome diferente de token", () => {
    expect(readSecretFromUrl("convite", { hash: "#convite=ol%C3%A1", search: "" })).toBe("olá");
    expect(withoutSecret("convite", { pathname: "/", hash: "#convite=abc&token=outro", search: "" })).toBe(
      "/#token=outro",
    );
  });
});
