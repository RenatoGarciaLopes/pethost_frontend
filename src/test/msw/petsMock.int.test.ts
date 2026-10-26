import { afterEach, expect, it } from "vitest";
import { petsHandlers, resetPets } from "../../../e2e/support/handlers/pets.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { PostApiV1PetsResponse, PostApiV1PetsPetIdPhotosResponse } from "@/shared/api/generated/pets/pets.zod";
import { server } from "./server";
const API = "http://localhost:5099/api/v1";
const values = {
  species: "dog",
  name: "Mel",
  size: "small",
  sex: "female",
  isVaccinated: true,
  isNeutered: false,
  goodWithDogs: true,
  goodWithCats: false,
  goodWithKids: true,
};
afterEach(resetPets);
function caller(role = "owner", scenario = "single") {
  server.use(...petsHandlers);
  const account = switchAccounts.find((item) => item.user.role === role && item.scenario === scenario)!;
  const { accessToken } = issueSession(account.user);
  return (path: string, method = "GET", body?: object | FormData) =>
    fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
}
it("REQ-PNEW-016 mock cria por conta, aparece na lista e reset restaura", async () => {
  const call = caller();
  const response = await call("/pets", "POST", values);
  const created = await response.json();
  expect(response.status).toBe(201);
  expect(PostApiV1PetsResponse.safeParse(created).success).toBe(true);
  const list = await (await call("/pets/me")).json();
  expect(list.data.pets[0].id).toBe(created.data.id);
  expect((await (await caller("host", "both")("/pets/me")).json()).data.pets).toEqual([]);
  resetPets();
  expect((await (await call("/pets/me")).json()).data.pets).toEqual([]);
});
it("REQ-PNEW-004/005/010 mock recusa porte ausente, exótico sem descrição e chip repetido", async () => {
  const call = caller();
  for (const body of [
    { ...values, size: undefined },
    { ...values, species: "exotic", size: undefined },
  ]) {
    const response = await call("/pets", "POST", body);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  }
  expect((await call("/pets", "POST", { ...values, microchip: "123 456-789012345" })).status).toBe(201);
  const duplicate = await call("/pets", "POST", { ...values, microchip: "123456789012345" });
  expect(duplicate.status).toBe(409);
  expect((await duplicate.json()).error.code).toBe("PET_MICROCHIP_ALREADY_REGISTERED");
});
it("REQ-PNEW-007/018 mock recebe file, recusa duplicada/limite, preserva pet após falha", async () => {
  const call = caller();
  const pet = (await (await call("/pets", "POST", values)).json()).data;
  const photo = (name: string, data: string) => {
    const form = new FormData();
    form.append("file", new File([data], name, { type: "image/jpeg" }));
    return call(`/pets/${pet.id}/photos`, "POST", form);
  };
  const failed = await photo("falha.jpg", "falha");
  expect(failed.status).toBe(500);
  const uploaded = await photo("foto.jpg", "um");
  expect(PostApiV1PetsPetIdPhotosResponse.safeParse(await uploaded.json()).success).toBe(true);
  expect((await photo("outra.jpg", "um")).status).toBe(409);
  expect((await photo("foto.jpg", "dois")).status).toBe(200);
  expect((await photo("foto.jpg", "tres")).status).toBe(200);
  const limit = await photo("foto.jpg", "quatro");
  expect((await limit.json()).error.code).toBe("PET_PHOTO_LIMIT_REACHED");
  const list = (await (await call("/pets/me")).json()).data.pets;
  expect(list).toHaveLength(1);
  expect(list[0].photos).toHaveLength(3);
});
it("REQ-PNEW-016 mock impede acesso de outra conta e anfitrião sem aprovação", async () => {
  const owner = caller();
  const pet = (await (await owner("/pets", "POST", values)).json()).data;
  const host = caller("host", "both");
  const form = new FormData();
  form.append("file", new File(["x"], "foto.jpg", { type: "image/jpeg" }));
  expect((await host(`/pets/${pet.id}/photos`, "POST", form)).status).toBe(404);
  expect((await caller("host", "unverified")("/pets", "POST", values)).status).toBe(404);
  expect((await fetch(`${API}/pets`, { method: "POST", body: JSON.stringify(values) })).status).toBe(401);
});
it("REQ-PEDIT-002/005/012/013 mock compartilha detalhe/lista e oculta outra conta", async () => {
  const call = caller();
  const created = (await (await call("/pets", "POST", { ...values, microchip: "123456789012345" })).json()).data;
  const path = `/pets/${created.id}`;
  expect((await caller("host", "both")(path)).status).toBe(404);
  expect((await (await call(path)).json()).data.name).toBe("Mel");
  expect((await call(path, "PATCH", { name: "Lua", breed: "", notes: null })).status).toBe(200);
  expect((await (await call("/pets/me")).json()).data.pets[0].name).toBe("Lua");
  expect((await call(path, "PATCH", { species: "exotic", speciesDescription: "Iguana" })).status).toBe(200);
  const exotic = (await (await call(path)).json()).data;
  expect(exotic.size).toBeNull();
  expect(exotic.speciesDescription).toBe("Iguana");
  expect((await call(path, "PATCH", { species: "dog" })).status).toBe(400);
  expect((await call(`${path}/deactivation`, "POST")).status).toBe(200);
  expect((await call(`${path}/deactivation`, "POST")).status).toBe(200);
  expect((await call(path, "PATCH", { name: "Luna" })).status).toBe(200);
  expect((await (await call(path)).json()).data.isActive).toBe(false);
  expect((await call("/pets", "POST", { ...values, microchip: "123456789012345" })).status).toBe(201);
  expect((await call(`${path}/deactivation`, "DELETE")).status).toBe(409);
  await call(path, "PATCH", { microchip: "" });
  expect((await call(`${path}/deactivation`, "DELETE")).status).toBe(200);
});
it("REQ-PEDIT-008/010 mock substitui mantendo id e ordem, remove e libera fingerprint", async () => {
  const call = caller();
  const created = (await (await call("/pets", "POST", values)).json()).data;
  const path = `/pets/${created.id}/photos`;
  const photo = (data: string) => {
    const form = new FormData();
    form.append("file", new File([data], "foto.jpg", { type: "image/jpeg" }));
    return form;
  };
  const first = (await (await call(path, "POST", photo("um"))).json()).data.photos[0];
  const second = (await (await call(path, "POST", photo("dois"))).json()).data.photos[1];
  expect((await call(`${path}/${first.id}`, "PATCH", photo("dois"))).status).toBe(409);
  const replaced = (await (await call(`${path}/${first.id}`, "PATCH", photo("tres"))).json()).data;
  expect(replaced.photos.map((item: { id: string }) => item.id)).toEqual([first.id, second.id]);
  expect(replaced.photos[0].url).not.toBe(first.url);
  expect((await call(path, "POST", photo("um"))).status).toBe(200);
  expect((await call(`${path}/${first.id}`, "DELETE")).status).toBe(200);
  expect((await call(`${path}/${first.id}`, "DELETE")).status).toBe(404);
  expect((await call(`${path}/${first.id}`, "PATCH", photo("x"))).status).toBe(404);
  expect((await call(path, "POST", photo("tres"))).status).toBe(200);
  expect((await caller("host", "both")(`${path}/${second.id}`, "DELETE")).status).toBe(404);
});
it("REQ-PEDIT-002 mock oculta pets alheios em todas as mutações e mantém estado após validação recusada", async () => {
  const owner = caller();
  const pet = (await (await owner("/pets", "POST", values)).json()).data;
  const path = `/pets/${pet.id}`;
  const other = caller("host", "both");
  for (const [suffix, method, body] of [
    ["", "PATCH", { name: "Outro" }],
    ["/deactivation", "POST", undefined],
    ["/deactivation", "DELETE", undefined],
    ["/photos/missing", "PATCH", undefined],
    ["/photos/missing", "DELETE", undefined],
  ] as const) {
    const response = await other(`${path}${suffix}`, method, body);
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PET_NOT_FOUND");
  }
  for (const patch of [{ name: "" }, { weightKg: 151 }, { species: "exotic" }, { microchip: "123" }])
    expect((await owner(path, "PATCH", patch)).status).toBe(400);
  expect((await (await owner(path)).json()).data.name).toBe("Mel");
  expect((await (await owner(path)).json()).data.species).toBe("dog");
});
it("REQ-HPETS-002/003 mock recusa lista e cadastro de anfitrião pendente", async () => {
  const call = caller("host", "unverified");
  for (const [method, path, body] of [
    ["GET", "/pets/me", undefined],
    ["POST", "/pets", values],
  ] as const) {
    const response = await call(path, method, body);
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PET_KEEPER_NOT_FOUND");
  }
});
it("REQ-HPETS-005/006 mock vitrine usa perfil separado da conta, só ativos e acompanha mudanças", async () => {
  const host = caller("host", "both");
  const owner = caller("owner", "both");
  const list = (await (await host("/pets/me")).json()).data;
  const account = switchAccounts.find((item) => item.user.role === "host" && item.scenario === "both")!;
  expect(list.keeper.type).toBe("host");
  expect(list.keeper.id).not.toBe(account.user.id);
  const path = `/hosts/${list.keeper.id}/pets`;
  expect((await (await owner(path)).json()).data.pets).toEqual([]);
  const created = (await (await host("/pets", "POST", { ...values, name: "Bóris" })).json()).data;
  expect((await (await owner(path)).json()).data.pets.map((pet: { name: string }) => pet.name)).toEqual(["Bóris"]);
  expect((await (await owner("/pets/me")).json()).data.pets.some((pet: { name: string }) => pet.name === "Bóris")).toBe(
    false,
  );
  await host(`/pets/${created.id}`, "PATCH", { name: "Bóris da casa" });
  expect((await (await owner(path)).json()).data.pets[0].name).toBe("Bóris da casa");
  await host(`/pets/${created.id}/deactivation`, "POST");
  expect((await (await owner(path)).json()).data.pets).toEqual([]);
  await host(`/pets/${created.id}/deactivation`, "DELETE");
  expect((await (await owner(path)).json()).data.pets).toHaveLength(1);
  expect((await owner(`/hosts/${account.user.id}/pets`)).status).toBe(404);
  expect((await fetch(`${API}${path}`)).status).toBe(401);
});
