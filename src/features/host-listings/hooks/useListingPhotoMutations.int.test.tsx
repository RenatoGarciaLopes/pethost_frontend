import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { listingDtoSchema } from "../api/contracts";
import { toListing } from "../api/mappers";
import { listingQueries } from "../api/queries";
import { useListingPhotoMutations } from "./useListingPhotoMutations";

const ACCOUNT = "account-1";
const ID = listingDto().id;
const photo = (n: number) => ({
  id: `0199e0a0-0000-7000-8000-00000000f00${n}`,
  url: `https://cdn.test/${n}.jpg`,
  position: n,
});
const withPhotos = (count: number) =>
  listingDto({ photos: Array.from({ length: count }, (_, index) => photo(index + 1)) });
const file = () => new File(["imagem"], "sala.jpg", { type: "image/jpeg" });

function setup(dto = withPhotos(3)) {
  const client = createTestQueryClient();
  const listing = toListing(listingDtoSchema.parse(dto));
  server.use(http.get("*/api/listings/me", () => HttpResponse.json(apiOk(myListingsDto([dto])))));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const view = renderHook(() => useListingPhotoMutations(ACCOUNT, listing), { wrapper });
  return { ...view, client, detailKey: listingQueries.detail(ACCOUNT, ID).queryKey };
}

describe("useListingPhotoMutations", () => {
  it("REQ-LIST-014 foto nova entra no fim e a resposta vai para o detalhe", async () => {
    server.use(
      http.post(`*/api/listings/${ID}/photos`, () => HttpResponse.json(apiOk(withPhotos(4)), { status: 201 })),
    );
    const { result, client, detailKey } = setup();
    await act(() => result.current.add(3, file()));
    expect(client.getQueryData(detailKey)?.photos).toHaveLength(4);
  });

  it("REQ-LIST-014 'Usar como capa' e mover mandam a ordem inteira", async () => {
    const orders: unknown[] = [];
    server.use(
      http.put(`*/api/listings/${ID}/photos/order`, async ({ request }) => {
        orders.push(await request.json());
        return HttpResponse.json(apiOk(withPhotos(3)));
      }),
    );
    const { result } = setup();
    await act(() => result.current.move(2, 0));
    await act(() => result.current.move(0, 1));
    expect(orders).toEqual([
      { photoIds: [photo(3).id, photo(1).id, photo(2).id] },
      { photoIds: [photo(2).id, photo(1).id, photo(3).id] },
    ]);
  });

  it("REQ-LIST-014 erro de foto fica na vaga; uma operação por vez", async () => {
    server.use(
      http.post(`*/api/listings/${ID}/photos`, () =>
        HttpResponse.json(apiFail("LISTING_PHOTO_ALREADY_EXISTS"), { status: 409 }),
      ),
    );
    const { result } = setup();
    await act(() => result.current.add(3, file()));
    expect(result.current.errors[3]).toBe("Essa foto já está no cantinho.");
    expect(result.current.busySlot).toBeNull();
  });

  it("REQ-LIST-014 foto que já sumiu recarrega o cantinho sem erro na vaga", async () => {
    server.use(
      http.delete(`*/api/listings/${ID}/photos/:photoId`, () =>
        HttpResponse.json(apiFail("LISTING_PHOTO_NOT_FOUND"), { status: 404 }),
      ),
      http.get(`*/api/listings/${ID}`, () => HttpResponse.json(apiOk(withPhotos(2)))),
    );
    const { result, client, detailKey } = setup();
    client.setQueryData(detailKey, toListing(listingDtoSchema.parse(withPhotos(3))));
    await act(() => result.current.remove(1));
    expect(result.current.errors[1]).toBeNull();
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });
});
