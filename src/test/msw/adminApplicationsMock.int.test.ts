import { beforeEach, expect, it } from "vitest";
import { server } from "./server";
import { createFetchTransport } from "@/shared/api/transport/fetchTransport";
import {
  adminApplicationListSchema,
  adminApplicationSchema,
  signedDocumentSchema,
} from "@/features/admin-host-applications";
import { adminApplicationsHandlers, resetAdminApplications } from "../../../e2e/support/handlers/adminApplications.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
const admin = switchAccounts.find((item) => item.user.role === "admin")!;
const baseUrl = "http://localhost:5099/api/v1";
beforeEach(() => {
  resetAdminApplications();
  server.use(...adminApplicationsHandlers);
});
it("REQ-AQUEUE-001/006/012 mock lista 27, emite foto sem cache e decisão sai da fila", async () => {
  const token = issueSession(admin.user).accessToken;
  const transport = createFetchTransport({ baseUrl, headers: () => ({ authorization: `Bearer ${token}` }) });
  const list = await transport.request({ method: "GET", path: "/host-applications" }, adminApplicationListSchema);
  expect(list).toHaveLength(27);
  await expect(
    transport.request(
      { method: "GET", path: "/host-applications", query: { status: "unknown" } },
      adminApplicationListSchema,
    ),
  ).rejects.toMatchObject({ status: 400 });
  const id = list[0].id;
  const link = await transport.request(
    { method: "GET", path: `/host-applications/${id}/documents/front` },
    signedDocumentSchema,
  );
  expect(link.expiresAt).toBeGreaterThan(Date.now() / 1000);
  const image = await fetch(link.url);
  expect(image.headers.get("cache-control")).toContain("no-store");
  expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(0);
  const decided = await transport.request(
    { method: "POST", path: `/host-applications/${id}/approval`, body: { reason: "Conferido" } },
    adminApplicationSchema,
  );
  expect(decided.status).toBe("approved");
  expect(
    await transport.request({ method: "GET", path: "/host-applications" }, adminApplicationListSchema),
  ).toHaveLength(26);
});
it("REQ-AQUEUE-010/011/013 mock valida recusa e impede decisão repetida", async () => {
  const transport = createFetchTransport({
    baseUrl,
    headers: () => ({ authorization: `Bearer ${issueSession(admin.user).accessToken}` }),
  });
  const id = "0199d2a0-0000-7000-8000-000000003100";
  await expect(
    transport.request(
      { method: "POST", path: `/host-applications/${id}/rejection`, body: { reason: " ", rejectionReason: "other" } },
      adminApplicationSchema,
    ),
  ).rejects.toMatchObject({ status: 400 });
  const result = await transport.request(
    {
      method: "POST",
      path: `/host-applications/${id}/rejection`,
      body: { reason: "Nota sintética", rejectionReason: "suspected_fraud" },
    },
    adminApplicationSchema,
  );
  expect(result.status).toBe("rejected_final");
  await expect(
    transport.request(
      { method: "POST", path: `/host-applications/${id}/approval`, body: { reason: "Nota" } },
      adminApplicationSchema,
    ),
  ).rejects.toMatchObject({ status: 422 });
});
it("REQ-AQUEUE-005 mock recusa acesso de conta sem papel admin", async () => {
  const token = issueSession(switchAccounts[0].user).accessToken;
  const transport = createFetchTransport({ baseUrl, headers: () => ({ authorization: `Bearer ${token}` }) });
  await expect(
    transport.request({ method: "GET", path: "/host-applications" }, adminApplicationListSchema),
  ).rejects.toMatchObject({ status: 403 });
});
