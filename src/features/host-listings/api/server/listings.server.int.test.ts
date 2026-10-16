import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { hostMeDto, listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { getHostListingProfile, getListingDetail, getMyListings } from "./listings.server";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));

const API = "http://api.test/api/v1";

describe("listings.server", () => {
  it("REQ-LIST-001 lê os cantinhos e o perfil do anfitrião com o access da sessão", async () => {
    let authorized = 0;
    server.use(
      http.get(`${API}/listings/me`, ({ request }) => {
        if (request.headers.get("authorization") === "Bearer access-sintetico") authorized += 1;
        return HttpResponse.json(apiOk(myListingsDto([listingDto()])));
      }),
      http.get(`${API}/hosts/me`, ({ request }) => {
        if (request.headers.get("authorization") === "Bearer access-sintetico") authorized += 1;
        return HttpResponse.json(apiOk(hostMeDto({ stripePayoutsEnabled: false, stripeStatus: "in_progress" })));
      }),
    );
    expect((await getMyListings("account-1")).listings).toHaveLength(1);
    expect(await getHostListingProfile("account-1")).toMatchObject({
      kind: "person",
      firstName: "Aparecida",
      payoutsEnabled: false,
      stripeStatus: "in_progress",
    });
    expect(authorized).toBe(2);
  });

  it("REQ-LIST-002 anfitrião ainda não verificado (404) não tem perfil", async () => {
    server.use(http.get(`${API}/hosts/me`, () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })));
    expect(await getHostListingProfile("account-2")).toBeNull();
  });

  it("REQ-LIST-017 cantinho de outra conta ou inexistente vira o 404 da casca", async () => {
    server.use(http.get(`${API}/listings/:id`, () => HttpResponse.json(apiFail("LISTING_NOT_FOUND"), { status: 404 })));
    await expect(getListingDetail("account-1", listingDto().id)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("REQ-LIST-013 o detalhe vem no modelo do formulário", async () => {
    server.use(http.get(`${API}/listings/:id`, () => HttpResponse.json(apiOk(listingDto()))));
    const listing = await getListingDetail("account-3", listingDto().id);
    expect(listing.values).toMatchObject({ title: "Casa da Cida", nightlyRate: "60,00" });
  });
});
