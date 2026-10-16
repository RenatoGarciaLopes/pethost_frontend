import { afterEach, describe, expect, it } from "vitest";
import { resetAccountProfiles, setHostPayouts } from "../../../e2e/support/handlers/accountProfile.mjs";
import { listingsHandlers, resetListings } from "../../../e2e/support/handlers/listings.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { GetApiV1ListingsMeResponse, PostApiV1ListingsResponse } from "@/shared/api/generated/listings/listings.zod";
import { server } from "./server";

const API = "http://localhost:5099/api/v1";
const host = switchAccounts.find((item) => item.scenario === "both" && item.user.role === "host")!;
const body = {
  title: "Casa da Camila",
  description: "Casa com quintal.",
  homeType: "house",
  hasYard: true,
  hasDogs: false,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["rabbit"],
  acceptsSmall: false,
  acceptsMedium: false,
  acceptsLarge: false,
  capacity: 2,
  nightlyRate: 60,
  availableWeekdays: ["monday"],
  address: {
    zipCode: "87020000",
    street: "Av. Brasil",
    number: "120",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

afterEach(() => {
  resetListings();
  resetAccountProfiles();
});

function caller() {
  server.use(...listingsHandlers);
  const { accessToken } = issueSession(host.user);
  return async (path: string, method = "GET", payload?: object | FormData) => {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(payload && !(payload instanceof FormData) ? { "content-type": "application/json" } : {}),
      },
      body: payload instanceof FormData ? payload : payload ? JSON.stringify(payload) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
}

const photo = (content: string) => {
  const data = new FormData();
  data.append("file", new File([content], "foto.png", { type: "image/png" }));
  return data;
};

describe("mock de cantinhos", () => {
  it("REQ-LIST-002 sem recebimento liberado o cadastro é recusado", async () => {
    const response = await caller()("/listings", "POST", body);
    expect([response.status, response.body.error.code]).toEqual([422, "LISTING_HOST_PAYOUTS_NOT_ENABLED"]);
  });

  it("REQ-LIST-011 REQ-LIST-012 cadastra no formato do contrato, recusa campos juntos e o segundo da pessoa física", async () => {
    setHostPayouts(host.user.id, true);
    const call = caller();
    const invalid = await call("/listings", "POST", { ...body, title: "", capacity: 11 });
    expect(invalid.body.error.details.map((item: { field: string }) => item.field)).toEqual(["title", "capacity"]);

    const created = await call("/listings", "POST", body);
    expect(created.status).toBe(201);
    expect(PostApiV1ListingsResponse.safeParse(created.body).success).toBe(true);
    expect((await call("/listings", "POST", body)).body.error.code).toBe("LISTING_LIMIT_REACHED");

    const mine = await call("/listings/me");
    expect(GetApiV1ListingsMeResponse.parse(mine.body).data?.listings).toHaveLength(1);
  });

  it("REQ-LIST-013 REQ-LIST-014 REQ-LIST-015 altera, pausa, põe e reordena fotos", async () => {
    setHostPayouts(host.user.id, true);
    const call = caller();
    const { id } = (await call("/listings", "POST", body)).body.data;
    expect((await call(`/listings/${id}`, "PATCH", { capacity: 4 })).body.data.capacity).toBe(4);
    expect((await call(`/listings/${id}/deactivation`, "POST")).body.data.isActive).toBe(false);
    expect((await call(`/listings/${id}/deactivation`, "DELETE")).body.data.isActive).toBe(true);

    await call(`/listings/${id}/photos`, "POST", photo("a"));
    const two = (await call(`/listings/${id}/photos`, "POST", photo("b"))).body.data.photos;
    expect((await call(`/listings/${id}/photos`, "POST", photo("a"))).body.error.code).toBe(
      "LISTING_PHOTO_ALREADY_EXISTS",
    );
    const reordered = await call(`/listings/${id}/photos/order`, "PUT", { photoIds: [two[1].id, two[0].id] });
    expect(
      reordered.body.data.photos.map((item: { id: string; position: number }) => [item.id, item.position]),
    ).toEqual([
      [two[1].id, 1],
      [two[0].id, 2],
    ]);
  });
});
