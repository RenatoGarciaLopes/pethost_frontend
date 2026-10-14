import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { useMyPets } from "./useMyPets";

it("REQ-PETS-006 REQ-PETS-007 lê pelo BFF na chave da conta; invalidar a raiz de pets busca de novo", async () => {
  let calls = 0;
  server.use(
    http.get("*/api/pets/me", () => {
      calls += 1;
      return HttpResponse.json(
        apiOk({ keeper: petKeeperDto, pets: [petDto({ name: calls === 1 ? "Thor" : "Thor II" })] }),
      );
    }),
  );
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMyPets("account-1"), { wrapper });
  await waitFor(() => expect(result.current.data?.active[0]?.name).toBe("Thor"));

  await queryClient.invalidateQueries({ queryKey: accountQueryKey("account-1", "pets") });

  await waitFor(() => expect(result.current.data?.active[0]?.name).toBe("Thor II"));
  expect(calls).toBe(2);
});
