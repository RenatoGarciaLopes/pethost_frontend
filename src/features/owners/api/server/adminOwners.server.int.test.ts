import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { adminOwnerQueries } from "../queries";
import { prefetchAdminOwner, prefetchAdminOwners } from "./adminOwners.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "fake-admin" } : undefined) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

it("REQ-AACC-001/004 prefetch tutor envia access do admin e hidrata só as chaves da feature", async () => {
  const owner = adminOwnerFixture();
  server.use(
    http.get("http://api.test/api/v1/owners", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer fake-admin");
      return HttpResponse.json(apiOk([owner]));
    }),
    http.get(`http://api.test/api/v1/owners/${owner.id}`, () => HttpResponse.json(apiOk(owner))),
  );
  const client = createQueryClient();
  await prefetchAdminOwners(client, "admin");
  await prefetchAdminOwner(client, "admin", owner.id);
  expect(client.getQueryData(adminOwnerQueries.detail("admin", owner.id).queryKey)).toEqual(owner);
  client.clear();
});

it("REQ-AACC-004 tutor ausente usa o 404 da casca", async () => {
  server.use(
    http.get("http://api.test/api/v1/owners/:id", () => HttpResponse.json(apiFail("OWNER_NOT_FOUND"), { status: 404 })),
  );
  await expect(prefetchAdminOwner(createQueryClient(), "admin", adminOwnerFixture().id)).rejects.toThrow(
    "NEXT_NOT_FOUND",
  );
});
