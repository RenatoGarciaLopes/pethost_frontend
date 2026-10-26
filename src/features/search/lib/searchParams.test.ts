import { describe, expect, it } from "vitest";
import { queryToSearchParams, searchParamsToQuery, toApiSearch } from "./searchParams";

describe("REQ-SRCH-002 parser único", () => {
  it("ignora filtros avançados removidos de links antigos e nunca os reenvia", () => {
    const legacy = new URLSearchParams(
      "where=Maringá&maxNightlyRate=80&minNightlyRate=10&minCapacity=2&weekdays=monday&neighborhood=Zona+7",
    );
    const query = searchParamsToQuery(legacy);
    expect(queryToSearchParams(query).toString()).toBe("where=Maring%C3%A1");
    const api = toApiSearch(query, [], 1);
    for (const key of ["maxNightlyRate", "minNightlyRate", "minCapacity", "weekdays", "neighborhood"])
      expect(api).not.toHaveProperty(key);
  });
  it("preserva ida e volta, listas repetidas, falsos, lugar e raio explícito", () => {
    const query = searchParamsToQuery(
      new URLSearchParams(
        "where=Maringá&radius=20&hasKids=false&species=dog,cat&species=dog&sizes=large&from=2027-01-01&to=2027-01-03",
      ),
    );
    expect(searchParamsToQuery(queryToSearchParams(query))).toEqual(query);
    expect(query.species).toEqual(["dog", "cat"]);
    expect(toApiSearch(query, [], 2)).toMatchObject({
      city: "Maringá",
      radiusKm: 20,
      hasKids: false,
      checkIn: "2027-01-01",
      page: 2,
    });
  });
  it("ignora inválidos e nunca deixa NaN, Infinity ou datas inexistentes passarem", () => {
    const query = searchParamsToQuery(
      new URLSearchParams(
        "radius=Infinity&pets=invalid&count=999&hasKids=no&homeType=tent&from=2026-02-30&species=cat,bogus",
      ),
    );
    expect(query).toEqual({ pets: [], species: ["cat"], sizes: [] });
    expect(toApiSearch(query, [], 1)).toMatchObject({ radiusKm: 10, pets: 1 });
  });
  it("REQ-SRCH-004 deriva quantidade, espécies e portes dos pets ativos e ignora ids desconhecidos", () => {
    const query = searchParamsToQuery(new URLSearchParams("pets=0199d2a0-0000-7000-8000-0000000000e1"));
    expect(toApiSearch(query, [{ id: query.pets[0]!, name: "Luna", species: "dog", size: "medium" }], 1)).toMatchObject(
      { pets: 1, species: ["dog"], sizes: ["medium"] },
    );
    expect(toApiSearch(query, [], 1).species).toEqual([]);
  });
  it("busca por cidade não envia raio implícito", () => {
    expect(toApiSearch(searchParamsToQuery(new URLSearchParams("where=Curitiba")), [], 1).radiusKm).toBeUndefined();
  });
  it("REQ-SRCH-002 lê o objeto do App Router e limita números, listas e UF", () => {
    const query = searchParamsToQuery({
      state: "pr",
      pets: ["0199d2a0-0000-7000-8000-0000000000e1", "0199d2a0-0000-7000-8000-0000000000e2"],
      radius: "5",
      count: "200",
      hasYard: "false",
      ignored: "anything",
    });
    expect(query).toMatchObject({
      state: "PR",
      radius: 5,
      count: 200,
      hasYard: false,
    });
    expect(query.pets).toHaveLength(2);
    expect(queryToSearchParams(query).has("ignored")).toBe(false);
    expect(
      searchParamsToQuery({
        radius: "4",
        count: "1.5",
        state: "XX",
        sizes: "tiny",
        where: "x".repeat(81),
      }),
    ).toEqual(searchQueryFixtureForInvalid());
  });
});

function searchQueryFixtureForInvalid() {
  return { pets: [], species: [], sizes: [] };
}
