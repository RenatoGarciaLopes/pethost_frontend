import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { server } from "@/test/msw/server";
import { auditPageFixture, auditEntryFixture } from "@/test/fixtures/audit";
import { listAuditEntries } from "./audit.client";

const transport = createBffClient({ baseUrl: "http://audit.test/api" });
const envelope = (data: unknown) => HttpResponse.json({ success: true, data, timestamp: new Date().toISOString() });

it("REQ-AUDIT-001/002/004/005 envia nomes e datas definidos no OpenAPI", async () => {
  server.use(
    http.get("http://audit.test/api/audit-entries", ({ request }) => {
      const params = new URL(request.url).searchParams;
      expect([...params.keys()].sort()).toEqual([
        "action",
        "actorId",
        "from",
        "page",
        "pageSize",
        "targetId",
        "targetType",
        "to",
      ]);
      expect(params.get("page")).toBe("2");
      expect(params.get("pageSize")).toBe("50");
      expect(params.get("targetType")).toBe("owner");
      expect(params.get("from")).toBe("2026-10-15T00:00:00.000-03:00");
      expect(request.method).toBe("GET");
      return envelope(auditPageFixture([auditEntryFixture()]));
    }),
  );

  const page = await listAuditEntries(
    {
      action: "owner.suspended",
      targetType: "owner",
      targetId: "15d2c8a8-8f67-44f7-8eb3-4ecf56c65e83",
      actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
      from: "2026-10-15T00:00:00.000-03:00",
      to: "2026-10-15T23:59:59.999-03:00",
      page: 2,
      pageSize: 50,
    },
    transport,
  );

  expect(page.items[0]?.occurredAt).toBeInstanceOf(Date);
  expect(page.totalCount).toBe(1);
});

it("REQ-AUDIT-006 falha fechado se details divergir do contrato de texto", async () => {
  server.use(
    http.get("http://audit.test/api/audit-entries", () => {
      const page = auditPageFixture();
      return envelope({ ...page, items: [{ ...page.items[0], details: { count: 3 } }] });
    }),
  );

  await expect(listAuditEntries({ page: 1, pageSize: 20 }, transport)).rejects.toMatchObject({
    code: "CONTRACT_MISMATCH",
  });
});
