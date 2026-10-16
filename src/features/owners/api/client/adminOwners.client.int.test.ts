import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { apiOk } from "@/test/fixtures/session";
import { adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { createBffClient } from "@/shared/api/client/bffClient";
import { listOwners, getOwner, suspendOwner, liftOwnerSuspension, releaseOwnerCpf } from "./adminOwners.client";
it("REQ-AACC-004/005/006/007 clientes tutor usam motivo nos POST e nenhum corpo no DELETE", async () => {
  const owner = adminOwnerFixture();
  const transport = createBffClient({ baseUrl: "http://accounts.test/api" });
  server.use(
    http.get("http://accounts.test/api/owners", () => HttpResponse.json(apiOk([owner]))),
    http.get("http://accounts.test/api/owners/:id", () => HttpResponse.json(apiOk(owner))),
    http.post("http://accounts.test/api/owners/:id/suspension", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Conferido" });
      return HttpResponse.json(apiOk(owner));
    }),
    http.delete("http://accounts.test/api/owners/:id/suspension", async ({ request }) => {
      expect(await request.text()).toBe("");
      return HttpResponse.json(apiOk(owner));
    }),
    http.post("http://accounts.test/api/owners/:id/cpf-release", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Conferido" });
      return HttpResponse.json(apiOk({ ...owner, cpf: null }));
    }),
  );
  expect(await listOwners(transport)).toHaveLength(1);
  expect((await getOwner(owner.id, transport)).id).toBe(owner.id);
  await suspendOwner(owner.id, { reason: " Conferido " }, transport);
  await liftOwnerSuspension(owner.id, transport);
  expect((await releaseOwnerCpf(owner.id, { reason: "Conferido" }, transport)).cpf).toBeNull();
  expect(() => suspendOwner(owner.id, { reason: " " }, transport)).toThrow();
});
