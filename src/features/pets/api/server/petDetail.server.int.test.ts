import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { petDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../queries";
import { prefetchPetDetail } from "./petDetail.server";
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "synthetic" }) }),
  headers: async () => new Headers(),
}));
it("REQ-PEDIT-001 prefetch autentica e grava detalhe da conta", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/:id", ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer synthetic");
      return HttpResponse.json(apiOk(petDto()));
    }),
  );
  const client = createQueryClient();
  const detail = await prefetchPetDetail(client, "a", petDto().id);
  expect(client.getQueryData(petQueries.detail("a", petDto().id).queryKey)).toEqual(detail);
  expect(detail.values.name).toBe("Thor");
  client.clear();
});
it.each([
  [404, "PET_NOT_FOUND"],
  [403, "FORBIDDEN"],
])("REQ-PEDIT-002 oculta pet indisponível %s", async (status, code) => {
  server.use(
    http.get("http://api.test/api/v1/pets/:id", () =>
      HttpResponse.json(apiFail(String(code)), { status: Number(status) }),
    ),
  );
  const client = createQueryClient();
  await expect(prefetchPetDetail(client, "a", petDto().id)).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  client.clear();
});
it("REQ-PEDIT-002 relança outros erros", async () => {
  server.use(
    http.get("http://api.test/api/v1/pets/:id", () => HttpResponse.json(apiFail("VALIDATION_ERROR"), { status: 400 })),
  );
  const client = createQueryClient();
  await expect(prefetchPetDetail(client, "a", petDto().id)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  client.clear();
});
