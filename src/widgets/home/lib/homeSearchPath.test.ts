import { describe, expect, it } from "vitest";
import { buildHomeSearchPath } from "./homeSearchPath";

describe("REQ-HOME-005 destino de busca", () => {
  it("mantém localização, datas e mais de um pet pela seleção", () => {
    expect(
      buildHomeSearchPath({
        where: "Zona 7, Maringá",
        from: "2026-11-01",
        to: "2026-11-05",
        petIds: ["pet-1", "pet-2"],
      }),
    ).toBe("/search?where=Zona+7%2C+Maring%C3%A1&from=2026-11-01&to=2026-11-05&pets=pet-1&pets=pet-2");
  });

  it("omite os valores vazios e preserva as espécies quando ainda não há pet cadastrado", () => {
    expect(buildHomeSearchPath({ where: "  ", from: "", to: "", petIds: [], species: ["dog", "cat"] })).toBe(
      "/search?species=dog&species=cat",
    );
  });

  it("leva a quantidade escolhida pelo anfitrião no parâmetro da API", () => {
    expect(buildHomeSearchPath({ petCount: 3 })).toBe("/search?pets=3");
  });

  it("codifica texto livre e deixa a busca sem filtro como /search", () => {
    expect(buildHomeSearchPath({ where: "Maringá & região" })).toBe("/search?where=Maring%C3%A1+%26+regi%C3%A3o");
    expect(buildHomeSearchPath({})).toBe("/search");
  });
});
