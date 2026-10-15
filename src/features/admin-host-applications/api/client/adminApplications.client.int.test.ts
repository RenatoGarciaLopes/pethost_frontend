import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { createBffClient } from "@/shared/api/client/bffClient";
import { listApplications, getDocumentLink, approveApplication, rejectApplication } from "./adminApplications.client";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";

const transport = createBffClient({ baseUrl: "http://admin.test/api" });
const item = adminApplicationFixture();
const envelope = (data: unknown) => HttpResponse.json({ success: true, data, timestamp: new Date().toISOString() });
it("REQ-AQUEUE-001/002 consulta status e valida o contrato administrativo", async () => {
  server.use(
    http.get("http://admin.test/api/host-applications", ({ request }) => {
      expect(new URL(request.url).searchParams.get("status")).toBe("submitted");
      return envelope([item]);
    }),
  );
  expect(await listApplications("submitted", transport)).toEqual([item]);
});
it("REQ-AQUEUE-006 link só é pedido pelo endpoint auditado, com no-cache", async () => {
  server.use(
    http.get(`http://admin.test/api/host-applications/${item.id}/documents/front`, ({ request }) => {
      expect(request.headers.get("cache-control")).toBe("no-store");
      return envelope({ kind: "front", url: "https://private.test/photo", expiresAt: 2_000_000_000 });
    }),
  );
  expect((await getDocumentLink(item.id, "front", transport)).kind).toBe("front");
});
it("REQ-AQUEUE-009/010 valida os corpos antes de enviar aprovação ou recusa", async () => {
  server.use(
    http.post(`http://admin.test/api/host-applications/${item.id}/approval`, async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Conferido" });
      return envelope({ ...item, status: "approved" });
    }),
    http.post(`http://admin.test/api/host-applications/${item.id}/rejection`, async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Foto cortada", rejectionReason: "document_illegible" });
      return envelope({ ...item, status: "rejected" });
    }),
  );
  expect((await approveApplication(item.id, { reason: " Conferido " }, transport)).status).toBe("approved");
  expect(
    (await rejectApplication(item.id, { reason: "Foto cortada", rejectionReason: "document_illegible" }, transport))
      .status,
  ).toBe("rejected");
  expect(() => approveApplication(item.id, { reason: " " }, transport)).toThrow();
});
