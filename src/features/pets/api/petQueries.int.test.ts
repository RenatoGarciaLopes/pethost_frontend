import { expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { createBffClient } from "@/shared/api/client/bffClient";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "./queries";
import { invalidatePetLists } from "./invalidatePetLists";
const transport = createBffClient({ baseUrl: "http://localhost/api" });
it("REQ-HPETS-005 conta de tutor e anfitrião não misturam pets nem invalidação", async () => {
  const client = createQueryClient();
  server.use(
    http.get("*/api/pets/me", () =>
      HttpResponse.json(apiOk({ keeper: petKeeperDto, pets: [petDto({ name: "Pet tutor" })] })),
    ),
  );
  await client.fetchQuery(petQueries.mine("owner-account", transport));
  const hostProfileId = "0199d2a0-0000-7000-8000-0000000000bb";
  server.use(
    http.get("*/api/pets/me", () =>
      HttpResponse.json(
        apiOk({
          keeper: { ...petKeeperDto, id: hostProfileId, type: "host" },
          pets: [petDto({ name: "Pet da casa" })],
        }),
      ),
    ),
  );
  await client.fetchQuery(petQueries.mine("host-account", transport));
  expect(client.getQueryData(petQueries.mine("owner-account").queryKey)?.active[0].name).toBe("Pet tutor");
  expect(client.getQueryData(petQueries.mine("host-account").queryKey)?.active[0].name).toBe("Pet da casa");
  client.setQueryData(petQueries.house(hostProfileId).queryKey, []);
  client.setQueryData(petQueries.house("another-profile").queryKey, []);
  await invalidatePetLists(client, "host-account");
  expect(client.getQueryState(petQueries.house(hostProfileId).queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(petQueries.house("another-profile").queryKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(petQueries.mine("owner-account").queryKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(petQueries.mine("host-account").queryKey)?.isInvalidated).toBe(true);
  client.clear();
});
it("REQ-HPETS-006/009 query pública usa id de perfil codificado e nunca cacheia dados privados", async () => {
  server.use(
    http.get("*/api/hosts/:hostId/pets", ({ params }) => {
      expect(params.hostId).toBe("profile/id");
      return HttpResponse.json(
        apiOk({
          keeper: { ...petKeeperDto, type: "host" },
          pets: [petDto({ microchip: "123456789012345", notes: "private-data" })],
        }),
      );
    }),
  );
  const client = createQueryClient();
  const options = petQueries.house("profile/id", transport);
  expect(options.queryKey).toEqual(["public", "host-pets", "profile/id"]);
  await client.fetchQuery(options);
  expect(JSON.stringify(client.getQueryData(options.queryKey))).not.toMatch(
    /microchip|123456789012345|private-data|vetContact|allergies/,
  );
  client.clear();
});
it.each(["hostId", "keeper"])(
  "REQ-HPETS-006 abertura direta usa %s da resposta quando a lista ainda não está no cache",
  async (field) => {
    const client = createQueryClient();
    client.setQueryData(petQueries.house("profile-direct").queryKey, []);
    client.setQueryData(petQueries.house("another-profile").queryKey, []);
    const pet =
      field === "hostId"
        ? { hostId: "profile-direct" }
        : { keeper: { ...petKeeperDto, id: "profile-direct", type: "host" } };
    await invalidatePetLists(client, "direct-account", pet);
    expect(client.getQueryState(petQueries.house("profile-direct").queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(petQueries.house("another-profile").queryKey)?.isInvalidated).toBe(false);
    client.clear();
  },
);
