import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { petDto } from "@/test/fixtures/pets";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../api/queries";
import { toPetDetail } from "../api/toPetDetail";
import { petDtoSchema } from "../api/contracts";
import { useUpdatePet, useDeactivatePet, useReactivatePet } from "./usePetMutations";
it("REQ-PEDIT-013/014 salva detalhe, invalida lista e preserva conflito sem retry", async () => {
  let gets = 0;
  let reactivations = 0;
  server.use(
    http.get("*/api/pets/:id", () => {
      gets++;
      return HttpResponse.json(apiOk(petDto()));
    }),
    http.patch("*/api/pets/:id", () => HttpResponse.json(apiOk(petDto({ name: "Mel" })))),
    http.post("*/api/pets/:id/deactivation", () => HttpResponse.json(apiOk(petDto({ isActive: false })))),
    http.delete("*/api/pets/:id/deactivation", () => {
      reactivations++;
      return HttpResponse.json(apiFail("PET_MICROCHIP_ALREADY_REGISTERED"), { status: 409 });
    }),
  );
  const client = createTestQueryClient();
  const detailKey = petQueries.detail("a", petDto().id).queryKey;
  const listKey = petQueries.mine("a").queryKey;
  client.setQueryData(detailKey, toPetDetail(petDtoSchema.parse(petDto())));
  client.setQueryData(listKey, { active: [], inactive: [], hostId: "profile-host" });
  client.setQueryData(petQueries.house("profile-host").queryKey, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      detail: useQuery(petQueries.detail("a", petDto().id)),
      update: useUpdatePet("a", petDto().id),
      deactivate: useDeactivatePet("a", petDto().id),
      reactivate: useReactivatePet("a", petDto().id),
    }),
    { wrapper },
  );
  await act(async () => {
    await result.current.update.mutateAsync({ name: "Mel" });
  });
  expect(client.getQueryData(detailKey)?.values.name).toBe("Mel");
  expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  expect(gets).toBe(0);
  expect(client.getQueryState(petQueries.house("profile-host").queryKey)?.isInvalidated).toBe(true);
  client.setQueryData(petQueries.house("profile-host").queryKey, []);
  await act(async () => {
    await result.current.deactivate.mutateAsync();
  });
  expect(client.getQueryData(detailKey)?.isActive).toBe(false);
  expect(client.getQueryState(petQueries.house("profile-host").queryKey)?.isInvalidated).toBe(true);
  await act(async () => {
    await expect(result.current.reactivate.mutateAsync()).rejects.toMatchObject({
      code: "PET_MICROCHIP_ALREADY_REGISTERED",
    });
  });
  await waitFor(() => expect(result.current.reactivate.isError).toBe(true));
  expect(reactivations).toBe(1);
  expect(client.getQueryData(detailKey)?.isActive).toBe(false);
  client.clear();
});
it("REQ-HPETS-006 tirar da lista por ficha aberta diretamente invalida vitrine pela resposta", async () => {
  const hostId = "0199d2a0-0000-7000-8000-0000000000bb";
  server.use(
    http.post("*/api/pets/:id/deactivation", () => HttpResponse.json(apiOk(petDto({ hostId, isActive: false })))),
  );
  const client = createTestQueryClient();
  client.setQueryData(petQueries.house(hostId).queryKey, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDeactivatePet("direct-account", petDto().id), { wrapper });
  await act(async () => {
    await result.current.mutateAsync();
  });
  expect(client.getQueryState(petQueries.house(hostId).queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryData(petQueries.detail("direct-account", petDto().id).queryKey)?.isActive).toBe(false);
  client.clear();
});
