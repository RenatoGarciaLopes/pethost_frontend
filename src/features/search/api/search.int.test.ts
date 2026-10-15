import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { apiOk } from "@/test/fixtures/session";
import { listingFixture, searchQueryFixture } from "@/test/fixtures/search";
import { server } from "@/test/msw/server";
import { searchQueries } from "./queries";
import { prefetchSearch } from "./server/search.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));
it("REQ-SRCH-007/008 prefetch valida contrato e hidrata a mesma chave isolada por conta", async () => {
  server.use(
    http.get("http://api.test/api/v1/listings", () =>
      HttpResponse.json(apiOk({ items: [listingFixture()], page: 1, pageSize: 12, totalCount: 1 })),
    ),
  );
  const client = new QueryClient();
  expect(await prefetchSearch(client, "owner", searchQueryFixture(), [])).toBeUndefined();
  const key = searchQueries.infinite("owner", searchQueryFixture(), []).queryKey;
  expect(client.getQueryData(key)).toMatchObject({
    pages: [{ items: [expect.objectContaining({ title: "Quintal da Cida" })] }],
    pageParams: [1],
  });
  expect(dehydrate(client).queries).toHaveLength(1);
  expect(client.getQueryData(searchQueries.infinite("other", searchQueryFixture(), []).queryKey)).toBeUndefined();
});
it("REQ-SRCH-011 prefetch transforma endereço não localizado em estado seguro", async () => {
  server.use(
    http.get("http://api.test/api/v1/listings", () =>
      HttpResponse.json(
        {
          success: false,
          error: { code: "LISTING_SEARCH_ADDRESS_NOT_LOCATED", message: "no location" },
          timestamp: new Date().toISOString(),
        },
        { status: 422 },
      ),
    ),
  );
  expect(await prefetchSearch(new QueryClient(), "owner", searchQueryFixture(), [])).toEqual({
    code: "LISTING_SEARCH_ADDRESS_NOT_LOCATED",
    status: 422,
    fields: {},
  });
});
it("REQ-SRCH-007 valor desconhecido no contrato falha sem mostrar resumo parcial", async () => {
  server.use(
    http.get("http://api.test/api/v1/listings", () =>
      HttpResponse.json(
        apiOk({ items: [{ ...listingFixture(), badges: ["unknown"] }], page: 1, pageSize: 12, totalCount: 1 }),
      ),
    ),
  );
  expect(await prefetchSearch(new QueryClient(), "owner", searchQueryFixture(), [])).toMatchObject({
    code: "CONTRACT_MISMATCH",
  });
});
