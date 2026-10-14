import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { apiOk, apiFail, sessionUserFixture } from "@/test/fixtures/session";
import { petDto } from "@/test/fixtures/pets";
import { server } from "@/test/msw/server";
import { createPet, uploadPetPhoto } from "./petMutations.client";
import { createBffClient } from "@/shared/api/client/bffClient";
const transport = createBffClient({ baseUrl: "http://localhost/api" });
const id = petDto().id;
const body = {
  species: "dog",
  name: "Mel",
  size: "small",
  sex: "unknown",
  isVaccinated: false,
  isNeutered: false,
  goodWithDogs: false,
  goodWithCats: false,
  goodWithKids: false,
};
it("REQ-PNEW-016 cria pelo BFF com corpo JSON e valida resposta", async () => {
  server.use(
    http.post("*/api/pets", async ({ request }) => {
      expect(await request.json()).toEqual(body);
      expect(request.headers.get("x-pethost-request")).toBe("1");
      return HttpResponse.json(apiOk(petDto({ name: "Mel" })), { status: 201 });
    }),
  );
  expect((await createPet(body, transport)).name).toBe("Mel");
});
it("REQ-PNEW-007/016 envia multipart na parte file", async () => {
  server.use(
    http.post(`*/api/pets/${id}/photos`, async ({ request }) => {
      expect(request.headers.get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
      const data = await request.formData();
      const file = data.get("file") as File;
      expect(file.name).toBe("foto.jpg");
      expect(file.type).toBe("image/jpeg");
      expect(await file.text()).toBe("imagem");
      expect([...data.keys()]).toEqual(["file"]);
      return HttpResponse.json(apiOk(petDto()));
    }),
  );
  expect((await uploadPetPhoto(id, new File(["imagem"], "foto.jpg", { type: "image/jpeg" }), transport)).id).toBe(id);
});
it.each([
  [409, "PET_PHOTO_ALREADY_EXISTS"],
  [413, "PAYLOAD_TOO_LARGE"],
  [415, "UNSUPPORTED_MEDIA_TYPE"],
  [422, "PET_PHOTO_LIMIT_REACHED"],
])("REQ-PNEW-007/018 propaga foto recusada %s %s", async (status, code) => {
  server.use(
    http.post(`*/api/pets/${id}/photos`, () => HttpResponse.json(apiFail(String(code)), { status: Number(status) })),
  );
  await expect(uploadPetPhoto(id, new File(["x"], "foto.jpg"), transport)).rejects.toMatchObject({ status, code });
});
it("REQ-PNEW-017 criação preserva conflito de microchip e mensagens de campos", async () => {
  server.use(
    http.post("*/api/pets", () => HttpResponse.json(apiFail("PET_MICROCHIP_ALREADY_REGISTERED"), { status: 409 })),
  );
  await expect(createPet(body, transport)).rejects.toMatchObject({
    code: "PET_MICROCHIP_ALREADY_REGISTERED",
    status: 409,
  });
  server.use(
    http.post("*/api/pets", () =>
      HttpResponse.json(apiFail("VALIDATION_ERROR", "invalid", [{ field: "name", messages: ["Confere o nome."] }]), {
        status: 400,
      }),
    ),
  );
  await expect(createPet(body, transport)).rejects.toMatchObject({ fieldErrors: { name: ["Confere o nome."] } });
});
it("REQ-PNEW-019 primeiro 401 renova e reenvia o mesmo arquivo sem recriar pet", async () => {
  let sends = 0;
  let refresh = 0;
  server.use(
    http.post(`*/api/pets/${id}/photos`, async ({ request }) => {
      sends++;
      const file = (await request.formData()).get("file") as File;
      expect(await file.text()).toBe("imagem");
      return sends === 1
        ? HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 })
        : HttpResponse.json(apiOk(petDto()));
    }),
    http.post("*/api/auth/sessions/refresh", () => {
      refresh++;
      return HttpResponse.json(apiOk({ user: sessionUserFixture }));
    }),
  );
  await uploadPetPhoto(id, new File(["imagem"], "foto.jpg", { type: "image/jpeg" }), transport);
  expect(sends).toBe(2);
  expect(refresh).toBe(1);
});
