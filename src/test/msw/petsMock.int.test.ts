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
