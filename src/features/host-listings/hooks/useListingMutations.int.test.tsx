import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { listingQueries } from "../api/queries";
import { useCreateListing, useDeactivateListing, useReactivateListing, useUpdateListing } from "./useListingMutations";

const ACCOUNT = "account-1";
const ID = listingDto().id;

function setup() {
  const client = createTestQueryClient();
  client.setQueryData(listingQueries.mine(ACCOUNT).queryKey, { isCompany: false, payoutsEnabled: true, listings: [] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  server.use(http.get("*/api/listings/me", () => HttpResponse.json(apiOk(myListingsDto([listingDto()])))));
  const view = renderHook(
    () => ({
      create: useCreateListing(ACCOUNT),
      update: useUpdateListing(ACCOUNT, ID),
      pause: useDeactivateListing(ACCOUNT, ID),
      reopen: useReactivateListing(ACCOUNT, ID),
    }),
    { wrapper },
  );
  return { ...view, client, detailKey: listingQueries.detail(ACCOUNT, ID).queryKey };
}

describe("useListingMutations", () => {
  it("REQ-LIST-011 REQ-LIST-016 cadastrar grava o detalhe e invalida meus cantinhos", async () => {
    server.use(http.post("*/api/listings", () => HttpResponse.json(apiOk(listingDto()), { status: 201 })));
    const { result, client, detailKey } = setup();
    await act(() => result.current.create.mutateAsync({ title: "Casa da Cida" }));
    expect(client.getQueryData(detailKey)?.title).toBe("Casa da Cida");
    expect(client.getQueryState(listingQueries.mine(ACCOUNT).queryKey)?.isInvalidated).toBe(true);
  });

  it("REQ-LIST-013 REQ-LIST-015 salvar, pausar e reabrir gravam a resposta, sem otimismo", async () => {
    server.use(
      http.patch(`*/api/listings/${ID}`, () => HttpResponse.json(apiOk(listingDto({ capacity: 5 })))),
      http.post(`*/api/listings/${ID}/deactivation`, () => HttpResponse.json(apiOk(listingDto({ isActive: false })))),
      http.delete(`*/api/listings/${ID}/deactivation`, () =>
        HttpResponse.json(apiFail("LISTING_HOST_DEACTIVATED"), { status: 403 }),
      ),
    );
    const { result, client, detailKey } = setup();
    await act(() => result.current.update.mutateAsync({ capacity: 5 }));
    expect(client.getQueryData(detailKey)?.values.capacity).toBe(5);
    await act(() => result.current.pause.mutateAsync());
    expect(client.getQueryData(detailKey)?.isActive).toBe(false);

    await act(async () => {
      await expect(result.current.reopen.mutateAsync()).rejects.toMatchObject({ code: "LISTING_HOST_DEACTIVATED" });
    });
    expect(client.getQueryData(detailKey)?.isActive).toBe(false);
  });
});
