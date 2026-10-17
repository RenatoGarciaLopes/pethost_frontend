import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { getListingPageDetail } from "./listingPage.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic" }) }),
  headers: async () => new Headers(),
}));

it("REQ-LPAGE-008 hides unavailable listings behind the shell 404", async () => {
  server.use(
    http.get("http://api.test/api/v1/listings/:id", () =>
      HttpResponse.json(apiFail("LISTING_NOT_FOUND"), { status: 404 }),
    ),
  );
  await expect(getListingPageDetail("account-int-1", "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c")).rejects.toThrow(
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
});

it("REQ-LPAGE-001 fetches detail with the authenticated backend transport", async () => {
  server.use(
    http.get("http://api.test/api/v1/listings/:id", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer synthetic");
      return HttpResponse.json(
        apiOk({
          id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
          hostId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
          title: "Quintal",
          description: "",
          hasYard: false,
          hasDogs: false,
          hasCats: false,
          hasKids: false,
          acceptedSpecies: ["dog"],
          acceptsSmall: true,
          acceptsMedium: false,
          acceptsLarge: false,
          capacity: 1,
          nightlyRate: 10,
          availableWeekdays: ["monday"],
          address: { neighborhood: "Centro", city: "Curitiba", state: "PR" },
          photos: [],
          isActive: true,
          createdAt: "2026-10-15T12:00:00Z",
          updatedAt: "2026-10-15T12:00:00Z",
        }),
      );
    }),
  );
  await expect(getListingPageDetail("account-int-2", "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c")).resolves.toMatchObject({
    title: "Quintal",
  });
});
