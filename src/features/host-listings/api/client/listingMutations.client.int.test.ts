import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { listingDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import {
  addListingPhoto,
  createListing,
  deactivateListing,
  reactivateListing,
  removeListingPhoto,
  reorderListingPhotos,
  replaceListingPhoto,
  updateListing,
} from "./listingMutations.client";

const transport = createBffClient({ baseUrl: "http://localhost/api" });
const id = listingDto().id;
const photoId = "0199e0a0-0000-7000-8000-0000000000f1";
const photo = () => new File(["imagem"], "sala.jpg", { type: "image/jpeg" });

describe("listingMutations.client", () => {
  it("REQ-LIST-011 cadastra com POST pelo BFF e valida a resposta", async () => {
    server.use(
      http.post("*/api/listings", async ({ request }) => {
        expect(await request.json()).toEqual({ title: "Casa da Cida" });
        expect(request.headers.get("x-pethost-request")).toBe("1");
        return HttpResponse.json(apiOk(listingDto()), { status: 201 });
      }),
    );
    expect((await createListing({ title: "Casa da Cida" }, transport)).id).toBe(id);
  });

  it("REQ-LIST-012 recusa do cadastro chega com o código e os campos", async () => {
    server.use(
      http.post("*/api/listings", () =>
        HttpResponse.json(apiFail("VALIDATION_ERROR", "x", [{ field: "address.zipCode", messages: ["CEP"] }]), {
          status: 400,
        }),
      ),
    );
    await expect(createListing({}, transport)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: { "address.zipCode": ["CEP"] },
    });
  });

  it("REQ-LIST-013 corrige com PATCH só do que mudou", async () => {
    server.use(
      http.patch(`*/api/listings/${id}`, async ({ request }) => {
        expect(await request.json()).toEqual({ capacity: 4 });
        return HttpResponse.json(apiOk(listingDto({ capacity: 4 })));
      }),
    );
    expect((await updateListing(id, { capacity: 4 }, transport)).capacity).toBe(4);
  });

  it("REQ-LIST-015 pausa (POST) e reabre (DELETE) pela desativação", async () => {
    server.use(
      http.post(`*/api/listings/${id}/deactivation`, () => HttpResponse.json(apiOk(listingDto({ isActive: false })))),
      http.delete(`*/api/listings/${id}/deactivation`, () => HttpResponse.json(apiOk(listingDto({ isActive: true })))),
    );
    expect((await deactivateListing(id, transport)).isActive).toBe(false);
    expect((await reactivateListing(id, transport)).isActive).toBe(true);
  });

  it("REQ-LIST-014 fotos: põe, troca (multipart na parte file), tira e reordena", async () => {
    const calls: string[] = [];
    server.use(
      http.post(`*/api/listings/${id}/photos`, async ({ request }) => {
        const data = await request.formData();
        calls.push(`POST ${[...data.keys()].join(",")}`);
        return HttpResponse.json(apiOk(listingDto()), { status: 201 });
      }),
      http.patch(`*/api/listings/${id}/photos/${photoId}`, async ({ request }) => {
        calls.push(`PATCH ${[...(await request.formData()).keys()].join(",")}`);
        return HttpResponse.json(apiOk(listingDto()));
      }),
      http.delete(`*/api/listings/${id}/photos/${photoId}`, () => {
        calls.push("DELETE");
        return HttpResponse.json(apiOk(listingDto()));
      }),
      http.put(`*/api/listings/${id}/photos/order`, async ({ request }) => {
        calls.push(`PUT ${JSON.stringify(await request.json())}`);
        return HttpResponse.json(apiOk(listingDto()));
      }),
    );
    await addListingPhoto(id, photo(), transport);
    await replaceListingPhoto(id, photoId, photo(), transport);
    await removeListingPhoto(id, photoId, transport);
    await reorderListingPhotos(id, [photoId], transport);
    expect(calls).toEqual(["POST file", "PATCH file", "DELETE", `PUT {"photoIds":["${photoId}"]}`]);
  });

  it.each([
    [422, "LISTING_PHOTO_LIMIT_REACHED"],
    [409, "LISTING_PHOTO_ALREADY_EXISTS"],
  ])("REQ-LIST-014 foto recusada %s %s", async (status, code) => {
    server.use(
      http.post(`*/api/listings/${id}/photos`, () =>
        HttpResponse.json(apiFail(String(code)), { status: Number(status) }),
      ),
    );
    await expect(addListingPhoto(id, photo(), transport)).rejects.toMatchObject({ status, code });
  });
});
