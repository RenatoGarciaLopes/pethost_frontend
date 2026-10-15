import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { myApplicationQueries } from "../queries";
import { prefetchMyApplication } from "./myApplication.server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));

it("REQ-HVER-011 prefetch lê a verificação com o access da sessão e guarda o modelo na chave da conta", async () => {
  let authorized = false;
  server.use(
    http.get("http://api.test/api/v1/hosts/me/application", ({ request }) => {
      authorized = request.headers.get("authorization") === "Bearer access-sintetico";
      return HttpResponse.json(apiOk(myApplicationDto({ application: hostApplicationDto() })));
    }),
  );
  const queryClient = createQueryClient();
  const mine = await prefetchMyApplication(queryClient, "account-1");

  expect(authorized).toBe(true);
  expect(mine?.application?.status).toBe("draft");
  expect(queryClient.getQueryData(myApplicationQueries.mine("account-1").queryKey)).toEqual(mine);
  queryClient.clear();
});

it("REQ-HVER-019 falha no prefetch devolve undefined e não inventa dado no cache", async () => {
  server.use(
    http.get("http://api.test/api/v1/hosts/me/application", () =>
      HttpResponse.json(apiFail("INTERNAL_ERROR"), { status: 500 }),
    ),
  );
  const queryClient = createQueryClient();
  expect(await prefetchMyApplication(queryClient, "account-2")).toBeUndefined();
  expect(queryClient.getQueryData(myApplicationQueries.mine("account-2").queryKey)).toBeUndefined();
  queryClient.clear();
});
