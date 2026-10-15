import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { dehydrate } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../queries";
import { prefetchHouseResidents } from "./houseResidents.server";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic-access" }) }),
  headers: async () => new Headers(),
}));
it("REQ-HPETS-006/009 prefetch autenticado só desidrata a projeção da vitrine", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/:hostId/pets", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer synthetic-access");
      return HttpResponse.json(
        apiOk({
          keeper: { ...petKeeperDto, type: "host" },
          pets: [petDto({ notes: "secret-note", microchip: "123456789012345" })],
        }),
      );
    }),
  );
  const client = createQueryClient();
  await prefetchHouseResidents(client, "host-profile");
  expect(client.getQueryData(petQueries.house("host-profile").queryKey)?.[0].name).toBe("Thor");
  expect(JSON.stringify(dehydrate(client))).not.toMatch(/secret-note|microchip|123456789012345/);
  client.clear();
});
it("REQ-HPETS-008 prefetch falhando não derruba a página", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/:hostId/pets", () =>
      HttpResponse.json(apiFail("PET_HOST_NOT_FOUND"), { status: 404 }),
    ),
  );
  const client = createQueryClient();
  await expect(prefetchHouseResidents(client, "missing")).resolves.toBeUndefined();
  expect(client.getQueryState(petQueries.house("missing").queryKey)?.status).toBe("error");
  client.clear();
});
it("REQ-HPETS-008 prefetch registra só status e código em desenvolvimento", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  server.use(
    http.get("http://api.test/api/v1/hosts/:hostId/pets", () =>
      HttpResponse.json(apiFail("UNEXPECTED_ERROR", "raw private message"), { status: 500 }),
    ),
  );
  const client = createQueryClient();
  try {
    await prefetchHouseResidents(client, "unavailable");
    expect(log).toHaveBeenCalledWith("HouseResidents", { status: 500, code: "UNEXPECTED_ERROR" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("raw private message");
  } finally {
    client.clear();
    log.mockRestore();
    vi.unstubAllEnvs();
  }
});
