import { expect, it, vi } from "vitest";
import { listingFixture } from "@/test/fixtures/search";
import { NEARBY_PAGE_SIZE, NEARBY_RADIUS_KM, searchQueries } from "./queries";

const page = { items: [listingFixture()], page: 1, pageSize: NEARBY_PAGE_SIZE, totalCount: 1 };

it("REQ-NEARBY-005 pede por coordenada com o raio e a página fixos, sem endereço nem datas", async () => {
  const request = vi.fn().mockResolvedValue(page);
  const query = searchQueries.nearby("visitor", { latitude: -23.43, longitude: -51.94 }, { request });
  await query.queryFn!({ signal: new AbortController().signal } as never);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "GET",
      path: "/listings",
      query: { latitude: -23.43, longitude: -51.94, radiusKm: NEARBY_RADIUS_KM, pageSize: NEARBY_PAGE_SIZE },
    }),
    expect.anything(),
  );
});

it("REQ-NEARBY-006 a chave separa quem vê e o ponto, para os selos não vazarem entre contas", () => {
  const point = { latitude: -23.43, longitude: -51.94 };
  expect(searchQueries.nearby("visitor", point).queryKey).not.toEqual(searchQueries.nearby("owner-1", point).queryKey);
  expect(searchQueries.nearby("visitor", point).queryKey).not.toEqual(
    searchQueries.nearby("visitor", { ...point, latitude: -25 }).queryKey,
  );
});

it("REQ-NEARBY-007 a reserva pede só a página fixa, sem lugar nem raio, e separa o cache por quem vê", async () => {
  const request = vi.fn().mockResolvedValue(page);
  const query = searchQueries.all("visitor", { request });
  await query.queryFn!({ signal: new AbortController().signal } as never);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({ method: "GET", path: "/listings", query: { pageSize: NEARBY_PAGE_SIZE } }),
    expect.anything(),
  );
  expect(searchQueries.all("visitor").queryKey).not.toEqual(searchQueries.all("owner-1").queryKey);
  expect(searchQueries.all("visitor").queryKey).not.toEqual(
    searchQueries.nearby("visitor", { latitude: 0, longitude: 0 }).queryKey,
  );
});
