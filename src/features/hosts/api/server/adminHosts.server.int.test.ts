import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { adminHostFixture } from "@/test/fixtures/adminAccounts";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { adminHostQueries } from "../queries";
import { prefetchAdminHost, prefetchAdminHosts } from "./adminHosts.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "fake-admin" } : undefined) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

it("REQ-AACC-002/014 lista de anfitriões envia filtro Stripe e hidrata o detalhe privado", async () => {
  const host = adminHostFixture({ stripeStatus: "rejected" });
  server.use(
    http.get("http://api.test/api/v1/hosts", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer fake-admin");
      expect(new URL(request.url).searchParams.get("stripeStatus")).toBe("rejected");
      return HttpResponse.json(apiOk([host]));
    }),
    http.get(`http://api.test/api/v1/hosts/${host.id}`, () => HttpResponse.json(apiOk(host))),
  );
  const client = createQueryClient();
  await prefetchAdminHosts(client, "admin", "rejected");
  await prefetchAdminHost(client, "admin", host.id);
  expect(client.getQueryData(adminHostQueries.detail("admin", host.id).queryKey)).toEqual(host);
  client.clear();
});

it("REQ-AACC-004 anfitrião ausente usa o 404 da casca", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/:id", () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })),
  );
  await expect(prefetchAdminHost(createQueryClient(), "admin", adminHostFixture().id)).rejects.toThrow(
    "NEXT_NOT_FOUND",
  );
});
