import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { accountQueryKey, createQueryClient } from "@/shared/api/query/queryClient";
import { ownerProfileDtoFixture, hostProfileDtoFixture } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { prefetchAccountProfile } from "./accountProfile.server";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));
it.each(["owner", "host"] as const)(
  "REQ-ACC-004/009 prefetch %s usa backend autenticado e chave da conta",
  async (role) => {
    let authenticated = false;
    server.use(
      http.get(`http://api.test/api/v1/${role}s/me`, ({ request }) => {
        authenticated =
          request.headers.get("authorization") === "Bearer access-sintetico" &&
          request.headers.get("x-forwarded-for") === "203.0.113.10";
        return HttpResponse.json(apiOk(role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture));
      }),
    );
    const queryClient = createQueryClient();
    await prefetchAccountProfile(queryClient, "user-1", role);
    expect(authenticated).toBe(true);
    expect(queryClient.getQueryData(accountQueryKey("user-1", "profile"))).toMatchObject({ role, verified: true });
    expect(JSON.stringify(queryClient.getQueryData(accountQueryKey("user-1", "profile")))).not.toContain(
      "access-sintetico",
    );
    queryClient.clear();
  },
);
it("REQ-ACC-011 prefetch conserva fallback sem data e falha sem inventar perfil", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me", () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })),
    http.get("http://api.test/api/v1/users/me", () => HttpResponse.json(apiOk(hostProfileDtoFixture.user))),
  );
  const queryClient = createQueryClient();
  await prefetchAccountProfile(queryClient, "user-1", "host");
  expect(queryClient.getQueryData(accountQueryKey("user-1", "profile"))).toMatchObject({
    verified: false,
    memberSince: null,
  });
  server.use(
    http.get("http://api.test/api/v1/owners/me", () => HttpResponse.json(apiFail("OWNER_NOT_FOUND"), { status: 404 })),
  );
  await prefetchAccountProfile(queryClient, "user-2", "owner");
  expect(queryClient.getQueryData(accountQueryKey("user-2", "profile"))).toBeUndefined();
  expect(queryClient.getQueryState(accountQueryKey("user-2", "profile"))?.status).toBe("error");
  queryClient.clear();
});
