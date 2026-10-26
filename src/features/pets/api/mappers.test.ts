import { describe, expect, it } from "vitest";
import { myPetsSchema } from "./contracts";
import { toPetList } from "./mappers";
import { petDto, petKeeperDto as keeper } from "@/test/fixtures/pets";

describe("REQ-PETS-001 REQ-PETS-005 lista de pets", () => {
  it("separa ativos e inativos mantendo a ordem da API e leva a capa", () => {
    const dto = myPetsSchema.parse({
      keeper,
      pets: [
        petDto({ id: "0199d2a0-0000-7000-8000-000000000003", name: "Mel", isActive: false }),
        petDto({ id: "0199d2a0-0000-7000-8000-000000000002", name: "Luna", species: "cat", size: null }),
        petDto({ name: "Thor", photos: [] }),
      ],
    });

    const list = toPetList(dto);

    expect(list.active.map((pet) => pet.name)).toEqual(["Luna", "Thor"]);
    expect(list.inactive.map((pet) => pet.name)).toEqual(["Mel"]);
    expect(list.active[0]).toMatchObject({ species: "cat", size: null, coverUrl: "https://cdn.pethost.test/thor.jpg" });
    expect(list.active[1].coverUrl).toBeNull();
  });

  it("lista vazia vira duas listas vazias", () => {
    expect(toPetList(myPetsSchema.parse({ keeper, pets: [] }))).toEqual({ active: [], inactive: [] });
  });

  it.each([
    ["species", "dragon"],
    ["size", "huge"],
    ["sex", "other"],
  ])("%s fora do contrato falha na leitura (não vira rótulo inventado)", (field, value) => {
    expect(myPetsSchema.safeParse({ keeper, pets: [petDto({ [field]: value })] }).success).toBe(false);
  });

  it("aceita maiúsculas como a API aceita na entrada", () => {
    const dto = myPetsSchema.parse({ keeper, pets: [petDto({ species: "Guinea_Pig", sex: "FEMALE" })] });
    expect(toPetList(dto).active[0]).toMatchObject({ species: "guinea_pig", sex: "female" });
  });
});
