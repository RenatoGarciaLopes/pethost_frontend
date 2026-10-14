import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { petDto } from "@/test/fixtures/pets";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { useCreatePet } from "./useCreatePet";
import { useUploadPetPhoto } from "./useUploadPetPhoto";
it("REQ-PNEW-016/020 mutations criam e enviam uma foto sem invalidar a lista antes do fim", async () => {
  let creates = 0;
  let uploads = 0;
  server.use(
    http.post("*/api/pets", () => {
      creates++;
      return HttpResponse.json(apiOk(petDto()));
    }),
    http.post(`*/api/pets/${petDto().id}/photos`, () => {
      uploads++;
      return HttpResponse.json(apiOk(petDto()));
    }),
  );
  const client = createTestQueryClient();
  client.setQueryData(["account", "a", "pets"], ["preservado"]);
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => ({ create: useCreatePet("a"), upload: useUploadPetPhoto() }), { wrapper });
  const values = {
    species: "dog" as const,
    name: "Mel",
    size: "small" as const,
    sex: "unknown" as const,
    isVaccinated: false,
    isNeutered: false,
    goodWithDogs: false,
    goodWithCats: false,
    goodWithKids: false,
  };
  await act(async () => {
    const pet = await result.current.create.mutateAsync(values);
    await result.current.upload.mutateAsync({ petId: pet.id, file: new File(["x"], "foto.jpg") });
  });
  expect(creates).toBe(1);
  expect(uploads).toBe(1);
  expect(invalidate).not.toHaveBeenCalled();
  expect(client.getQueryData(["account", "a", "pets"])).toEqual(["preservado"]);
});
