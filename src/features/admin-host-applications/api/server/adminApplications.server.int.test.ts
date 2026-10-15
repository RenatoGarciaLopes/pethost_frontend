import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { prefetchAdminApplication, prefetchAdminQueue } from "./adminApplications.server";
import { adminApplicationQueries } from "../queries";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "fake-admin" } : undefined) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
it("REQ-AQUEUE-001/005/007 prefetch autentica e não pede links privados", async () => {
  const item = adminApplicationFixture();
  server.use(
    http.get("http://api.test/api/v1/host-applications", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer fake-admin");
      return HttpResponse.json(apiOk([item]));
    }),
    http.get(`http://api.test/api/v1/host-applications/${item.id}`, () => HttpResponse.json(apiOk(item))),
  );
  const client = createQueryClient();
  await prefetchAdminQueue(client, "admin", "submitted");
  await prefetchAdminApplication(client, "admin", item.id);
  expect(client.getQueryData(adminApplicationQueries.detail("admin", item.id).queryKey)).toEqual(item);
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    ),
  ).not.toContain("expiresAt");
  client.clear();
});
it("REQ-AQUEUE-005 solicitação inexistente vira 404 da casca", async () => {
  server.use(
    http.get("http://api.test/api/v1/host-applications/:id", () =>
      HttpResponse.json(apiFail("HOST_APPLICATION_NOT_FOUND"), { status: 404 }),
    ),
  );
  await expect(prefetchAdminApplication(createQueryClient(), "admin", adminApplicationFixture().id)).rejects.toThrow(
    "NEXT_NOT_FOUND",
  );
});
