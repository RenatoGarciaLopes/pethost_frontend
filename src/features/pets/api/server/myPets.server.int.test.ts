import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../queries";
import { prefetchMyPets } from "./myPets.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));

it("REQ-PETS-006 prefetch lê /pets/me com o access da sessão e guarda a lista pronta na chave da conta", async () => {
  let authorized = false;
  server.use(
    http.get("http://api.test/api/v1/pets/me", ({ request }) => {
      authorized = request.headers.get("authorization") === "Bearer access-sintetico";
      return HttpResponse.json(
        apiOk({
          keeper: petKeeperDto,
          pets: [petDto(), petDto({ id: "0199d2a0-0000-7000-8000-000000000009", name: "Mel", isActive: false })],
        }),
      );
    }),
  );
  const queryClient = createQueryClient();
  await prefetchMyPets(queryClient, "account-1");

  expect(authorized).toBe(true);
  const list = queryClient.getQueryData(petQueries.mine("account-1").queryKey);
  expect(list?.active.map((pet) => pet.name)).toEqual(["Thor"]);
  expect(list?.inactive.map((pet) => pet.name)).toEqual(["Mel"]);
  queryClient.clear();
});

it("REQ-PETS-008 falha no prefetch fica como erro no cache (sem lista vazia inventada)", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/me", () => HttpResponse.json(apiFail("INTERNAL_ERROR"), { status: 500 })),
  );
  const queryClient = createQueryClient();
  await prefetchMyPets(queryClient, "account-1");
  expect(queryClient.getQueryData(petQueries.mine("account-1").queryKey)).toBeUndefined();
  expect(queryClient.getQueryState(petQueries.mine("account-1").queryKey)?.status).toBe("error");
  queryClient.clear();
});
